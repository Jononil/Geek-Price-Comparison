# -*- coding: utf-8 -*-
"""生成极客比价系统 全局 ER 图（实体名 + 关系 + 基数，matplotlib 绘制）。"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "DengXian"]
plt.rcParams["axes.unicode_minus"] = False

# 实体：key -> (中文名, 英文表名, 位置(x, y))
E = {
    # ---- RBAC 权限体系 ----
    "users":             ("用户", "users", (6, 90)),
    "roles":             ("角色", "roles", (6, 71)),
    "permissions":       ("权限", "permissions", (6, 52)),
    "user_roles":        ("用户-角色", "user_roles", (25, 80)),
    "role_permissions":  ("角色-权限", "role_permissions", (25, 61)),

    # ---- 基础数据 ----
    "categories":        ("分类", "categories", (46, 90)),
    "brands":            ("品牌", "brands", (46, 71)),
    "tags":              ("标签", "tags", (46, 52)),
    "platforms":         ("电商平台", "platforms", (46, 33)),

    # ---- 产品体系 ----
    "products":          ("产品", "products", (68, 75)),
    "product_specs":     ("产品参数", "product_specs", (90, 90)),
    "product_images":    ("产品图片", "product_images", (90, 72)),
    "product_tags":      ("产品-标签", "product_tags", (90, 54)),

    # ---- 价格体系 ----
    "product_prices":    ("平台价格", "product_prices", (68, 42)),
    "price_history":     ("历史价格", "price_history", (90, 25)),

    # ---- 内容体系 ----
    "review_articles":   ("专业测评", "review_articles", (46, 12)),
    "reviews":           ("用户评价", "reviews", (68, 12)),
    "review_comments":   ("评价评论", "review_comments", (27, 33)),
    "review_likes":      ("评价点赞", "review_likes", (27, 14)),

    # ---- 用户行为 ----
    "favorites":         ("收藏", "favorites", (6, 33)),
    "browse_history":    ("浏览历史", "browse_history", (6, 14)),
    "comparison_records":("对比记录", "comparison_records", (46, -3)),

    # ---- 推荐与算法 ----
    "recommendations":   ("推荐结果", "recommendations", (25, -3)),
    "algorithm_configs": ("算法配置", "algorithm_configs", (68, -5)),
}

# 关系：(实体A, 实体B, A端基数, B端基数)
REL = [
    ("users", "user_roles", "1", "N"),
    ("roles", "user_roles", "1", "N"),
    ("roles", "role_permissions", "1", "N"),
    ("permissions", "role_permissions", "1", "N"),

    ("categories", "products", "1", "N"),
    ("brands", "products", "1", "N"),
    ("products", "product_tags", "1", "N"),
    ("tags", "product_tags", "1", "N"),
    ("products", "product_specs", "1", "N"),
    ("products", "product_images", "1", "N"),

    ("products", "product_prices", "1", "N"),
    ("platforms", "product_prices", "1", "N"),
    ("products", "price_history", "1", "N"),
    ("platforms", "price_history", "1", "N"),

    ("products", "review_articles", "1", "N"),
    ("products", "reviews", "1", "N"),
    ("users", "reviews", "1", "N"),
    ("reviews", "review_comments", "1", "N"),
    ("reviews", "review_likes", "1", "N"),
    ("users", "review_comments", "1", "N"),
    ("users", "review_likes", "1", "N"),

    ("users", "favorites", "1", "N"),
    ("users", "browse_history", "1", "N"),
    ("products", "browse_history", "1", "N"),
    ("users", "comparison_records", "1", "N"),
    ("users", "recommendations", "1", "N"),
    ("products", "recommendations", "1", "N"),
]

BW = 15.0     # 实体框宽（数据单位）
BH = 3.2      # 实体框高（数据单位）

fig, ax = plt.subplots(figsize=(11, 7.5), dpi=160)
ax.set_xlim(-2, 104)
ax.set_ylim(-11, 100)
ax.set_aspect("auto")
ax.axis("off")

def box_xy(k):
    x, y = E[k][2]
    return x - BW/2, y - BH/2, BW, BH

# 1) 关系线（框下方）
for a, b, ca, cb in REL:
    xa, ya = E[a][2]
    xb, yb = E[b][2]
    ax.plot([xa, xb], [ya, yb], color="#94a3b8", lw=1.2, zorder=1)

# 2) 实体框（白色不透明覆盖线）
for k, (zh, en, (x, y)) in E.items():
    bx, by, w, h = box_xy(k)
    ax.add_patch(FancyBboxPatch((bx, by), w, h,
                 boxstyle="round,pad=0.3,rounding_size=0.6",
                 linewidth=1.3, edgecolor="#334155", facecolor="white", zorder=3))
    ax.text(x, y + 0.42, zh, ha="center", va="center", fontsize=11,
            fontweight="bold", color="#0f172a", zorder=4)
    ax.text(x, y - 0.52, en, ha="center", va="center", fontsize=8,
            color="#64748b", zorder=4)

# 3) 基数标注（框边缘外侧）
def exit_point(c1, c2, hw, hh):
    dx = c2[0] - c1[0]; dy = c2[1] - c1[1]
    if abs(dx) < 1e-6 and abs(dy) < 1e-6:
        return c1
    tx = hw / abs(dx) if abs(dx) > 1e-6 else 1e9
    ty = hh / abs(dy) if abs(dy) > 1e-6 else 1e9
    t = min(tx, ty)
    return (c1[0] + t * dx, c1[1] + t * dy)

for a, b, ca, cb in REL:
    p1 = exit_point(E[a][2], E[b][2], BW/2, BH/2)
    p2 = exit_point(E[b][2], E[a][2], BW/2, BH/2)
    for p, c in ((p1, ca), (p2, cb)):
        ax.text(p[0], p[1], c, ha="center", va="center", fontsize=9,
                color="#dc2626", fontweight="bold", zorder=5,
                bbox=dict(boxstyle="circle,pad=0.12", fc="#fef2f2",
                          ec="#dc2626", lw=0.8))

ax.set_title("极客比价系统 全局实体关系图（ER 图）", fontsize=14,
             fontweight="bold", color="#0f172a", pad=10)
plt.tight_layout()
plt.savefig("er_diagram.png", bbox_inches="tight", facecolor="white")
print("saved er_diagram.png")
