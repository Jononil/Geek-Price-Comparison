/**
 * 品牌/分类名称与规格键标签（与 PC 端 CompareView 对齐的最小集）
 * 全量 SPEC_GROUPS/KEY_LABEL/DIR/CAT_FOR 常量表在阶段四对比页完整版接入；
 * 本阶段对比页按 specLabel 分组展示（后端已返回中文标签），不做"更优值高亮"，
 * 避免在未移植完整常量表的情况下误判参数方向。
 */
export interface GroupDef {
  name: string
  keys: string[]
}

/** 分类 → 参数分组（仅覆盖已实测有数据的主要品类；其余走"全部参数"兜底） */
export const SPEC_GROUPS: Record<number, GroupDef[]> = {
  1: [
    { name: '基本信息', keys: ['os', 'release'] },
    { name: '性能', keys: ['chip', '处理器'] },
    { name: '屏幕', keys: ['screen_size', 'resolution', 'refresh', 'panel', 'screen', '屏幕'] },
    { name: '存储', keys: ['ram', 'storage', '运行内存', '存储'] },
    { name: '影像', keys: ['camera_rear', 'camera_front', '摄像头'] },
    { name: '续航', keys: ['battery', 'wired_charging', '电池'] },
    { name: '机身', keys: ['weight', '重量'] },
  ],
  3: [
    { name: '性能', keys: ['chip', 'CPU', 'GPU'] },
    { name: '屏幕', keys: ['screen', '屏幕'] },
    { name: '存储', keys: ['ram', 'storage', 'ssd', '内存', '硬盘'] },
    { name: '续航', keys: ['battery'] },
    { name: '机身', keys: ['weight', '重量'] },
  ],
  6: [
    { name: '基础', keys: ['type', '类型'] },
    { name: '降噪', keys: ['anc', '降噪'] },
    { name: '连接', keys: ['bt', '蓝牙', '连接'] },
    { name: '续航', keys: ['battery', '续航'] },
    { name: '音质', keys: ['driver', '驱动单元'] },
  ],
}
