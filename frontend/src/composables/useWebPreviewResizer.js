// 网页 / Markdown 预览面板的拖拽调宽逻辑。
// 通过 pointer 事件监听拖拽，按百分比限定在 [MIN, MAX] 区间；
// 拖拽结束后回调 onResizeEnd，供调用方重建滚动同步锚点等。
import { computed, ref } from "vue";

const MIN_WEB_PREVIEW_WIDTH_PERCENT = 20;
const MAX_WEB_PREVIEW_WIDTH_PERCENT = 80;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * 创建预览面板调宽控制器。
 * @param {() => HTMLElement | null} getPreviewBody 获取用于测量的容器（预览体）
 * @param {{ onResizeStart?: () => void, onResizeEnd?: () => void }} [options]
 * @returns {{
 *   widthPercent: import("vue").Ref<number>,
 *   resizing: import("vue").Ref<boolean>,
 *   panelStyle: import("vue").ComputedRef<{ flexBasis: string }>,
 *   handleResizeStart: (event: PointerEvent) => void,
 *   stop: () => void,
 * }}
 */
export function createWebPreviewResizer(getPreviewBody, options = {}) {
    const { onResizeStart, onResizeEnd } = options;
    const widthPercent = ref(45);
    const resizing = ref(false);
    let resizeRect = null;
    let pendingClientX = null;
    let frameId = 0;
    const panelStyle = computed(() => ({
        flexBasis: `${widthPercent.value}%`,
    }));

    function flushResize() {
        frameId = 0;
        if (!resizing.value || !resizeRect || pendingClientX === null) {
            return;
        }

        if (resizeRect.width <= 0) {
            return;
        }

        const previewWidth = resizeRect.right - pendingClientX;
        const nextPercent = (previewWidth / resizeRect.width) * 100;
        widthPercent.value = clamp(
            nextPercent,
            MIN_WEB_PREVIEW_WIDTH_PERCENT,
            MAX_WEB_PREVIEW_WIDTH_PERCENT,
        );
    }

    function handleResizeMove(event) {
        if (!resizing.value) {
            return;
        }

        pendingClientX = event.clientX;
        if (!frameId) {
            frameId = requestAnimationFrame(flushResize);
        }
    }

    function stop(event) {
        if (!resizing.value) {
            return;
        }

        if (event?.type === "pointerup" && Number.isFinite(event.clientX)) {
            pendingClientX = event.clientX;
        }
        if (frameId) {
            cancelAnimationFrame(frameId);
            frameId = 0;
        }
        flushResize();
        resizing.value = false;
        resizeRect = null;
        pendingClientX = null;
        window.removeEventListener("pointermove", handleResizeMove);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
        // 面板宽度变化会影响编辑器折行高度与预览元素偏移，需重建锚点。
        onResizeEnd?.();
    }

    function handleResizeStart(event) {
        const body = getPreviewBody();
        if (!body) {
            return;
        }

        event.preventDefault();
        resizeRect = body.getBoundingClientRect();
        resizing.value = true;
        onResizeStart?.();
        window.addEventListener("pointermove", handleResizeMove, {
            passive: true,
        });
        window.addEventListener("pointerup", stop, { once: true });
        window.addEventListener("pointercancel", stop, { once: true });
        handleResizeMove(event);
    }

    return { widthPercent, resizing, panelStyle, handleResizeStart, stop };
}
