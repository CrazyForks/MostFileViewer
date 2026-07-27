<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
      <div class="dialog-panel file-info-dialog">
        <div class="dialog-header">
          <span class="dialog-title">文件信息</span>
          <button type="button" class="dialog-close-btn" @click="handleClose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="dialog-close-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="dialog-body">
          <div v-if="loading" class="dialog-loading">加载中…</div>
          <div v-else-if="error" class="dialog-error">{{ error }}</div>
          <dl v-else-if="info" class="info-list">
            <div class="info-row">
              <dt class="info-label">路径</dt>
              <dd class="info-value info-value--path" :title="info.path">{{ info.path }}</dd>
            </div>
            <div class="info-row">
              <dt class="info-label">大小</dt>
              <dd class="info-value">{{ formatSize(info.size) }}</dd>
            </div>
            <div class="info-row">
              <dt class="info-label">修改时间</dt>
              <dd class="info-value">{{ info.modTime }}</dd>
            </div>
            <div v-if="info.isSymlink" class="info-row">
              <dt class="info-label">符号链接</dt>
              <dd class="info-value">是</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  info: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);

function handleClose() {
  emit('close');
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = (bytes / Math.pow(k, i)).toFixed(i > 0 ? 2 : 0);
  return `${size} ${units[i]}`;
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.visible) {
    handleClose();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>