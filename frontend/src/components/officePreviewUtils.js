import docxWasmUrl from "../../node_modules/@silurus/ooxml/dist/docx_parser_bg.wasm?url";
import pptxWasmUrl from "../../node_modules/@silurus/ooxml/dist/pptx_parser_bg.wasm?url";
import xlsxWasmUrl from "../../node_modules/@silurus/ooxml/dist/xlsx_parser_bg.wasm?url";

export const OFFICE_WORKER_TIMEOUT_MS = 15000;

const OFFICE_WASM_URLS = {
    word: docxWasmUrl,
    excel: xlsxWasmUrl,
    ppt: pptxWasmUrl,
};

export function getOfficeWasmUrl(type) {
    return OFFICE_WASM_URLS[type] ?? "";
}

export function normalizeOfficePreviewError(error, fallback = "Office 预览失败") {
    if (error instanceof Error) {
        return error.message || fallback;
    }
    const message = String(error ?? "").trim();
    return message || fallback;
}

export function waitForRenderableHost(element, timeoutMs = 1000) {
    if (!element) {
        return Promise.resolve(false);
    }
    if (hasRenderableSize(element)) {
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        let done = false;
        let observer = null;
        let rafId = 0;

        const finish = (ready) => {
            if (done) return;
            done = true;
            observer?.disconnect();
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            resolve(ready);
        };

        const check = () => {
            if (hasRenderableSize(element)) {
                finish(true);
            }
        };

        rafId = requestAnimationFrame(check);

        if (typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(check);
            observer.observe(element);
        }

        setTimeout(() => finish(hasRenderableSize(element)), timeoutMs);
    });
}

function hasRenderableSize(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}
