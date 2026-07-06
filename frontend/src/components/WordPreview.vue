<template>
    <div ref="host" class="word-preview"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useTheme } from "../composables/useTheme";
import {
    OFFICE_WORKER_TIMEOUT_MS,
    getOfficeWasmUrl,
    normalizeOfficePreviewError,
    waitForRenderableHost,
} from "./officePreviewUtils";

const props = defineProps({
    src: {
        type: ArrayBuffer,
        default: null,
    },
});

const emit = defineEmits(["error"]);

const host = ref(null);
let viewer = null;
let renderSequence = 0;

const { currentTheme } = useTheme();

function getThemeBackground() {
    const value = getComputedStyle(document.documentElement)
        .getPropertyValue("--bg-preview")
        .trim();
    return value || "#f0f0f0";
}

async function render(source) {
    const currentRender = ++renderSequence;

    viewer?.destroy();
    viewer = null;

    if (!source || !host.value) return;

    try {
        if (!(await waitForRenderableHost(host.value))) {
            if (currentRender === renderSequence) {
                emit("error", "预览区域尺寸异常，无法渲染 Word 文档");
            }
            return;
        }

        const { DocxScrollViewer } = await import("@silurus/ooxml/docx");

        if (currentRender !== renderSequence) return;

        viewer = new DocxScrollViewer(host.value, {
            background: getThemeBackground(),
            gap: 24,
            paddingTop: 28,
            enableTextSelection: true,
            enableZoom: true,
            wasmUrl: getOfficeWasmUrl("word"),
            workerTimeoutMs: OFFICE_WORKER_TIMEOUT_MS,
            onError: (err) => emit("error", normalizeOfficePreviewError(err)),
        });

        await viewer.load(source);

        if (currentRender !== renderSequence) {
            viewer?.destroy();
            viewer = null;
        }
    } catch (error) {
        if (currentRender !== renderSequence) return;
        viewer?.destroy();
        viewer = null;
        emit("error", normalizeOfficePreviewError(error));
    }
}

// 首次渲染在 onMounted 中触发，确保 host 模板 ref 已绑定到 DOM。
// watch 仅负责后续 src 变化时重新渲染（跳过初始值，避免与 onMounted 重复）。
watch(
    () => props.src,
    (source) => {
        if (source) render(source);
    },
);

onMounted(() => {
    if (props.src) render(props.src);
});

watch(currentTheme, () => {
    if (props.src) render(props.src);
});

onBeforeUnmount(() => {
    renderSequence += 1;
    viewer?.destroy();
    viewer = null;
});
</script>

<style scoped>
.word-preview {
    flex: 1;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
}
</style>
