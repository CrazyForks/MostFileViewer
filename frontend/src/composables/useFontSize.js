// 文本预览区字号缩放：状态、范围、持久化。
// 通过 CSS 变量 --mfv-font-size 统一驱动 CodeMirror 编辑器与 Markdown 预览。
// 缩放区间 10-32px；按住 Ctrl 滚动滚轮可调节；状态栏提供重置入口。
import { ref, watch } from "vue";

const STORAGE_KEY = "mfv-font-size";
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 32;
const DEFAULT_FONT_SIZE = 13;
const STEP = 1;

const fontSize = ref(DEFAULT_FONT_SIZE);
let initialized = false;

function readStoredFontSize() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) {
            return DEFAULT_FONT_SIZE;
        }
        const parsed = parseInt(stored, 10);
        if (
            Number.isFinite(parsed) &&
            parsed >= MIN_FONT_SIZE &&
            parsed <= MAX_FONT_SIZE
        ) {
            return parsed;
        }
    } catch (e) {
        // 忽略：localStorage 不可用时退回到默认值
    }
    return DEFAULT_FONT_SIZE;
}

function clampFontSize(value) {
    return Math.max(
        MIN_FONT_SIZE,
        Math.min(MAX_FONT_SIZE, Math.round(value)),
    );
}

function writeCssVariable(value) {
    // 写入 :root，编辑器与 Markdown 预览通过 var(--mfv-font-size) 自动响应。
    if (typeof document !== "undefined") {
        document.documentElement.style.setProperty(
            "--mfv-font-size",
            `${value}px`,
        );
    }
}

function persist(value) {
    try {
        localStorage.setItem(STORAGE_KEY, String(value));
    } catch (e) {
        // 忽略：localStorage 不可用时不阻塞主流程
    }
}

export function useFontSize() {
    if (!initialized) {
        initialized = true;
        fontSize.value = readStoredFontSize();
        writeCssVariable(fontSize.value);
    }

    function set(value) {
        const next = clampFontSize(value);
        if (next === fontSize.value) {
            return false;
        }
        fontSize.value = next;
        return true;
    }

    function adjust(delta) {
        // 按方向放大或缩小一档；不传 delta 时按 STEP 缩放。
        return set(fontSize.value + (delta ?? STEP));
    }

    function reset() {
        return set(DEFAULT_FONT_SIZE);
    }

    watch(fontSize, (value) => {
        writeCssVariable(value);
        persist(value);
    });

    return {
        fontSize,
        min: MIN_FONT_SIZE,
        max: MAX_FONT_SIZE,
        default: DEFAULT_FONT_SIZE,
        step: STEP,
        set,
        adjust,
        reset,
    };
}
