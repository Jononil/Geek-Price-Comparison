<template>
  <div class="card">
    <div class="page-hint">
      状态变更即时生效：用户端只展示「已通过」的图片；商品没有合格图片时将在用户端隐藏（数据库记录保留，本页始终可见可处理）。
    </div>

    <!-- 筛选栏 -->
    <div class="toolbar">
      <el-select v-model="query.auditStatus" placeholder="审核状态" clearable style="width: 170px">
        <el-option label="已通过" value="APPROVED" />
        <el-option label="已通过（需署名）" value="APPROVED_WITH_ATTRIBUTION" />
        <el-option label="待审核" value="PENDING_EVIDENCE" />
        <el-option label="已拒绝" value="REJECTED" />
      </el-select>
      <el-input v-model="query.keyword" placeholder="商品名称或ID" clearable style="width: 180px" @keyup.enter="search" />
      <el-input v-model="query.licenseType" placeholder="许可证，如 CC0 / CC BY" clearable style="width: 160px" @keyup.enter="search" />
      <el-checkbox v-model="query.pendingOnly">仅待审核</el-checkbox>
      <el-checkbox v-model="query.attributionIncomplete">署名缺失</el-checkbox>
      <el-checkbox v-model="query.riskOnly">有风险标记</el-checkbox>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <el-skeleton v-if="loading" :rows="6" animated />
    <el-table v-else :data="list" border>
      <el-table-column prop="license.id" label="ID" width="64" />
      <el-table-column label="图片" width="86">
        <template #default="{ row }">
          <el-image :src="row.imageUrl" :preview-src-list="[row.imageUrl]" preview-teleported fit="contain"
            style="width: 66px; height: 50px" />
        </template>
      </el-table-column>
      <el-table-column label="商品" min-width="150">
        <template #default="{ row }">
          <div>#{{ row.productId }} {{ row.productName }}</div>
          <div class="sub">图片ID {{ row.imageId }}</div>
        </template>
      </el-table-column>
      <el-table-column label="作者" width="130" show-overflow-tooltip>
        <template #default="{ row }">{{ row.license.author || '—' }}</template>
      </el-table-column>
      <el-table-column label="许可证" width="130">
        <template #default="{ row }">
          <el-link v-if="row.license.licenseUrl" :href="row.license.licenseUrl" target="_blank" type="primary">
            {{ row.license.license || '—' }}
          </el-link>
          <span v-else>{{ row.license.license || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="来源页面" width="90">
        <template #default="{ row }">
          <el-link v-if="row.license.sourcePageUrl" :href="row.license.sourcePageUrl" target="_blank" type="primary">原始页面</el-link>
          <el-tag v-else type="danger" size="small">缺失</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.license.auditStatus)">{{ statusText(row.license.auditStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="署名" width="70">
        <template #default="{ row }">
          <el-tag :type="row.attributionComplete ? 'success' : 'warning'" size="small">
            {{ row.attributionComplete ? '完整' : '缺失' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="风险" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-if="row.license.riskNotes" type="danger" size="small">有风险</el-tag>
          <span v-else class="sub">—</span>
        </template>
      </el-table-column>
      <el-table-column label="审核" width="140">
        <template #default="{ row }">
          <div class="sub">{{ row.license.reviewer || '—' }}</div>
          <div class="sub">{{ (row.license.reviewedAt ?? '').slice(0, 16) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">详情</el-button>
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="success" @click="openAudit(row, 'APPROVE')">通过</el-button>
          <el-button size="small" type="danger" @click="openAudit(row, 'REJECT')">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize"
      :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
      style="margin-top: 14px; justify-content: flex-end" @change="load" />

    <!-- 详情 -->
    <el-dialog v-model="detailVisible" title="授权详情" width="640px">
      <el-descriptions v-if="detail" :column="1" border size="small">
        <el-descriptions-item label="商品">#{{ detail.productId }} {{ detail.productName }}</el-descriptions-item>
        <el-descriptions-item label="图片">
          <el-image :src="detail.imageUrl" :preview-src-list="[detail.imageUrl]" preview-teleported
            fit="contain" style="width: 200px; height: 150px" />
        </el-descriptions-item>
        <el-descriptions-item label="来源">{{ detail.license.source || '—' }}</el-descriptions-item>
        <el-descriptions-item label="来源页面">
          <el-link v-if="detail.license.sourcePageUrl" :href="detail.license.sourcePageUrl" target="_blank">
            {{ detail.license.sourcePageUrl }}
          </el-link>
          <span v-else>—</span>
        </el-descriptions-item>
        <el-descriptions-item label="原始图片地址">
          <el-link v-if="detail.license.originalUrl" :href="detail.license.originalUrl" target="_blank">
            {{ detail.license.originalUrl }}
          </el-link>
          <span v-else>—</span>
        </el-descriptions-item>
        <el-descriptions-item label="作者">{{ detail.license.author || '—' }}</el-descriptions-item>
        <el-descriptions-item label="许可证">{{ detail.license.license || '—' }}</el-descriptions-item>
        <el-descriptions-item label="许可证链接">
          <el-link v-if="detail.license.licenseUrl" :href="detail.license.licenseUrl" target="_blank">
            {{ detail.license.licenseUrl }}
          </el-link>
          <span v-else>—</span>
        </el-descriptions-item>
        <el-descriptions-item label="署名文本">{{ detail.license.attributionText || '—' }}</el-descriptions-item>
        <el-descriptions-item label="改动说明">{{ detail.license.modifications || '—' }}</el-descriptions-item>
        <el-descriptions-item label="型号匹配">{{ detail.license.matchType || '—' }}</el-descriptions-item>
        <el-descriptions-item label="风险标记">
          <span v-if="detail.license.riskNotes" style="color: #dc2626">{{ detail.license.riskNotes }}</span>
          <span v-else>无</span>
        </el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="statusTag(detail.license.auditStatus)">{{ statusText(detail.license.auditStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核人/时间">
          {{ detail.license.reviewer || '—' }} {{ (detail.license.reviewedAt ?? '').slice(0, 19) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 编辑 -->
    <el-dialog v-model="editVisible" title="编辑授权信息（部分更新，留空字段保持原值）" width="640px">
      <el-form label-width="90px">
        <el-form-item label="来源"><el-input v-model="editForm.source" placeholder="如 wikimedia_commons" /></el-form-item>
        <el-form-item label="来源页面"><el-input v-model="editForm.sourcePageUrl" placeholder="https:// 开头的原始文件页面" /></el-form-item>
        <el-form-item label="原始图片"><el-input v-model="editForm.originalUrl" placeholder="https:// 开头的未缩放图片地址" /></el-form-item>
        <el-form-item label="许可证"><el-input v-model="editForm.license" placeholder="含版本，如 CC BY-SA 4.0" /></el-form-item>
        <el-form-item label="许可链接"><el-input v-model="editForm.licenseUrl" placeholder="https:// 开头的许可证地址" /></el-form-item>
        <el-form-item label="作者"><el-input v-model="editForm.author" placeholder="按证据原文照录，不得臆造" /></el-form-item>
        <el-form-item label="署名文本"><el-input v-model="editForm.attributionText" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="改动说明"><el-input v-model="editForm.modifications" placeholder="如：官方 500px 缩放版" /></el-form-item>
        <el-form-item label="型号匹配">
          <el-select v-model="editForm.matchType" style="width: 220px">
            <el-option label="EXACT_MATCH（精确型号）" value="EXACT_MATCH" />
            <el-option label="SERIES_LEVEL（系列参考图）" value="SERIES_LEVEL" />
            <el-option label="PARTIAL（证据不足）" value="PARTIAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险标记">
          <el-input v-model="editForm.riskNotes" type="textarea" :rows="2"
            placeholder="人工复核确认风险已解除后，清空本框；否则填写风险说明" />
          <div class="sub" style="margin-top: 4px">存在风险标记时无法审核通过；清空并保存视为人工解除。</div>
        </el-form-item>
      </el-form>
      <div class="sub">保存后记录将重新进入「待审核」，由审核操作决定是否重新上线。</div>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 审核 -->
    <el-dialog v-model="auditVisible" :title="auditForm.action === 'APPROVE' ? '审核通过' : '审核拒绝'" width="480px">
      <div v-if="auditTarget" style="margin-bottom: 12px">
        #{{ auditTarget.productId }} {{ auditTarget.productName }}（图片ID {{ auditTarget.imageId }}）
      </div>
      <el-radio-group v-model="auditForm.action">
        <el-radio value="APPROVE">通过</el-radio>
        <el-radio value="REJECT">拒绝</el-radio>
      </el-radio-group>
      <el-input v-model="auditForm.reason" type="textarea" :rows="3" style="margin-top: 12px"
        :placeholder="auditForm.action === 'REJECT' ? '拒绝原因（必填，将留痕到风险标记）' : '备注（可选）'" />
      <div v-if="auditForm.action === 'APPROVE'" class="sub" style="margin-top: 8px">
        通过前后端将校验：风险标记已解除、来源/许可/署名齐全、许可为开放家族、型号匹配为 EXACT/SERIES。
      </div>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button :type="auditForm.action === 'APPROVE' ? 'success' : 'danger'" :loading="saving" @click="submitAudit">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { adminImageLicenseApi } from '@/api'

const loading = ref(false)
const saving = ref(false)
const list = ref<any[]>([])
const total = ref(0)

const query = reactive({
  page: 1, pageSize: 10,
  auditStatus: '', keyword: '', licenseType: '',
  pendingOnly: false, attributionIncomplete: false, riskOnly: false
})

const detailVisible = ref(false)
const detail = ref<any>(null)
const editVisible = ref(false)
const editId = ref<number>()
const editForm = ref<any>({})
const auditVisible = ref(false)
const auditTarget = ref<any>(null)
const auditForm = ref({ action: 'APPROVE', reason: '' })

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: query.page, pageSize: query.pageSize }
    if (query.auditStatus) params.auditStatus = query.auditStatus
    if (query.keyword?.trim()) params.keyword = query.keyword.trim()
    if (query.licenseType?.trim()) params.licenseType = query.licenseType.trim()
    if (query.pendingOnly) params.pendingOnly = true
    if (query.attributionIncomplete) params.attributionIncomplete = true
    if (query.riskOnly) params.riskOnly = true
    const result = await adminImageLicenseApi.list(params)
    list.value = result.records
    total.value = Number(result.total ?? 0)
  } finally {
    loading.value = false
  }
}

function search() { query.page = 1; load() }
function reset() {
  query.page = 1; query.auditStatus = ''; query.keyword = ''; query.licenseType = ''
  query.pendingOnly = false; query.attributionIncomplete = false; query.riskOnly = false
  load()
}

function statusText(s: string) {
  return { APPROVED: '已通过', APPROVED_WITH_ATTRIBUTION: '已通过·需署名', PENDING_EVIDENCE: '待审核', REJECTED: '已拒绝' }[s] ?? s
}
function statusTag(s: string) {
  return { APPROVED: 'success', APPROVED_WITH_ATTRIBUTION: 'primary', PENDING_EVIDENCE: 'warning', REJECTED: 'danger' }[s] ?? 'info'
}

function openDetail(row: any) { detail.value = row; detailVisible.value = true }

function openEdit(row: any) {
  editId.value = row.license.id
  editForm.value = {
    source: row.license.source ?? '',
    sourcePageUrl: row.license.sourcePageUrl ?? '',
    originalUrl: row.license.originalUrl ?? '',
    license: row.license.license ?? '',
    licenseUrl: row.license.licenseUrl ?? '',
    author: row.license.author ?? '',
    attributionText: row.license.attributionText ?? '',
    modifications: row.license.modifications ?? '',
    matchType: row.license.matchType ?? '',
    riskNotes: row.license.riskNotes ?? ''
  }
  editVisible.value = true
}

async function saveEdit() {
  if (!editId.value) return
  saving.value = true
  try {
    await adminImageLicenseApi.update(editId.value, editForm.value)
    ElMessage.success('已保存，记录重新进入待审核')
    editVisible.value = false
    load()
  } catch { /* 拦截器已提示 */ } finally {
    saving.value = false
  }
}

function openAudit(row: any, action: string) {
  auditTarget.value = row
  auditForm.value = { action, reason: '' }
  auditVisible.value = true
}

async function submitAudit() {
  if (!auditTarget.value) return
  if (auditForm.value.action === 'REJECT' && !auditForm.value.reason.trim()) {
    ElMessage.warning('拒绝必须填写原因')
    return
  }
  saving.value = true
  try {
    await adminImageLicenseApi.audit(auditTarget.value.license.id, {
      action: auditForm.value.action,
      reason: auditForm.value.reason.trim() || undefined
    })
    ElMessage.success(auditForm.value.action === 'APPROVE' ? '已通过审核' : '已拒绝')
    auditVisible.value = false
    load()
  } catch { /* 拦截器已提示后端校验失败原因 */ } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; }
.page-hint {
  margin-bottom: 14px; padding: 8px 12px; background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 6px; font-size: 12px; color: #1d4ed8;
}
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 16px; }
.sub { font-size: 11px; color: #9ca3af; }
</style>
