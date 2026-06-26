import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "@workspace/db";
import { signToken } from "../lib/jwt.js";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

function normalizeUser(row: Record<string, unknown>) {
  return {
    id: String(row["id"]),
    name: row["name"] as string,
    username: row["username"] as string | null,
    email: row["email"] as string,
    phoneNumber: row["phone_number"] as string | null,
    image: row["image"] as string | null,
    bio: row["bio"] as string | null,
    accountType: (row["account_type"] as string) ?? "public",
    primaryGovernorate: row["primary_governorate"] as string | null,
    role: (row["role"] as string) ?? "USER",
    isBanned: Boolean(row["is_banned"]),
    isActive: Boolean(row["is_active"]),
    createdAt: new Date(row["created_at"] as string | Date).getTime(),
  };
}

// ─── POST /api/users/register ────────────────────────────────────────────────
router.post("/users/register", async (req, res) => {
  const { name, username, email, password, governorate } = req.body as {
    name?: string;
    username?: string;
    email?: string;
    password?: string;
    governorate?: string;
  };

  if (!name || !email || !password) {
    return res.status(400).json({ error: "missing_fields", message: "الاسم والبريد وكلمة المرور مطلوبة" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username?.trim().toLowerCase();

  try {
    // Check email uniqueness
    const emailCheck = await pool.query(`SELECT id FROM users WHERE email = $1`, [normalizedEmail]);
    if (emailCheck.rowCount && emailCheck.rowCount > 0) {
      return res.status(409).json({ error: "email_exists", message: "البريد الإلكتروني مستخدم بالفعل" });
    }

    // Check username uniqueness
    if (normalizedUsername) {
      const usernameCheck = await pool.query(`SELECT id FROM users WHERE username = $1`, [normalizedUsername]);
      if (usernameCheck.rowCount && usernameCheck.rowCount > 0) {
        return res.status(409).json({ error: "username_exists", message: "اسم المستخدم مستخدم بالفعل" });
      }
    }

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (name, username, email, primary_governorate, account_type, role, is_active, is_banned)
       VALUES ($1, $2, $3, $4, 'public', 'USER', true, false)
       RETURNING *`,
      [name.trim(), normalizedUsername ?? null, normalizedEmail, governorate ?? null]
    );
    const user = userResult.rows[0];

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO user_passwords (user_id, password_hash) VALUES ($1, $2)`,
      [user.id, passwordHash]
    );

    const token = signToken({ userId: user.id, email: user.email });
    logger.info({ userId: user.id, email: user.email }, "[users] User registered");
    return res.status(201).json({ user: normalizeUser(user), token });
  } catch (err) {
    logger.error({ err }, "[users] Registration failed");
    return res.status(500).json({ error: "register_failed", message: "فشل إنشاء الحساب. حاول مرة أخرى." });
  }
});

// ─── POST /api/users/login ───────────────────────────────────────────────────
router.post("/users/login", async (req, res) => {
  const { identifier, password } = req.body as { identifier?: string; password?: string };

  if (!identifier || !password) {
    return res.status(400).json({ error: "missing_fields", message: "المعرّف وكلمة المرور مطلوبان" });
  }

  const id = identifier.trim().toLowerCase();

  try {
    const userResult = await pool.query(
      `SELECT u.*, up.password_hash
       FROM users u
       LEFT JOIN user_passwords up ON up.user_id = u.id
       WHERE u.email = $1 OR u.username = $1`,
      [id]
    );

    if (!userResult.rowCount || userResult.rowCount === 0) {
      return res.status(401).json({ error: "invalid_credentials", message: "بيانات الدخول غير صحيحة" });
    }

    const row = userResult.rows[0];

    if (row.is_banned) {
      return res.status(403).json({ error: "account_banned", message: "هذا الحساب محظور" });
    }

    const passwordHash = row.password_hash as string | null;
    if (!passwordHash) {
      return res.status(401).json({ error: "no_password", message: "يرجى إعادة تعيين كلمة المرور عبر OTP" });
    }

    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "invalid_credentials", message: "بيانات الدخول غير صحيحة" });
    }

    const token = signToken({ userId: row.id as number, email: row.email as string });
    logger.info({ userId: row.id }, "[users] User logged in");
    return res.json({ user: normalizeUser(row), token });
  } catch (err) {
    logger.error({ err }, "[users] Login failed");
    return res.status(500).json({ error: "login_failed", message: "فشل تسجيل الدخول. حاول مرة أخرى." });
  }
});

// ─── GET /api/users/me ───────────────────────────────────────────────────────
router.get("/users/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.userId]);
    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ error: "user_not_found" });
    }
    return res.json({ user: normalizeUser(result.rows[0]) });
  } catch (err) {
    logger.error({ err }, "[users] Get me failed");
    return res.status(500).json({ error: "get_me_failed" });
  }
});

// ─── PUT /api/users/me ───────────────────────────────────────────────────────
router.put("/users/me", authMiddleware, async (req: AuthRequest, res) => {
  const { name, username, bio, image, primaryGovernorate, accountType, pushToken } = req.body as {
    name?: string;
    username?: string;
    bio?: string;
    image?: string;
    primaryGovernorate?: string;
    accountType?: string;
    pushToken?: string;
  };

  try {
    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        username = COALESCE($2, username),
        bio = COALESCE($3, bio),
        image = COALESCE($4, image),
        primary_governorate = COALESCE($5, primary_governorate),
        account_type = COALESCE($6, account_type),
        push_token = COALESCE($7, push_token)
       WHERE id = $8
       RETURNING *`,
      [name ?? null, username?.trim().toLowerCase() ?? null, bio ?? null, image ?? null,
       primaryGovernorate ?? null, accountType ?? null, pushToken ?? null, req.userId]
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ error: "user_not_found" });
    }

    return res.json({ user: normalizeUser(result.rows[0]) });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "23505") {
      return res.status(409).json({ error: "duplicate_field", message: "اسم المستخدم أو البريد مستخدم بالفعل" });
    }
    logger.error({ err }, "[users] Update me failed");
    return res.status(500).json({ error: "update_failed" });
  }
});

// ─── GET /api/users/search?q= ────────────────────────────────────────────────
router.get("/users/search", authMiddleware, async (req: AuthRequest, res) => {
  const q = (req.query["q"] as string ?? "").trim();
  if (q.length < 1) {
    return res.json({ users: [] });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM users
       WHERE (name ILIKE $1 OR username ILIKE $1 OR email ILIKE $1)
         AND id != $2
         AND is_banned = false
       LIMIT 30`,
      [`%${q}%`, req.userId ?? 0]
    );
    return res.json({ users: result.rows.map(normalizeUser) });
  } catch (err) {
    logger.error({ err }, "[users] Search failed");
    return res.status(500).json({ error: "search_failed" });
  }
});

// ─── GET /api/users/:userId ──────────────────────────────────────────────────
router.get("/users/:userId", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.params["userId"]]);
    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ error: "user_not_found" });
    }
    const u = normalizeUser(result.rows[0]);
    // Don't expose email for public profiles
    return res.json({ user: { ...u, email: undefined } });
  } catch (err) {
    logger.error({ err }, "[users] Get user failed");
    return res.status(500).json({ error: "get_user_failed" });
  }
});

// ─── GET /api/admin/users — all users (super admin only) ─────────────────────
router.get("/admin/users", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const roleResult = await pool.query(`SELECT role FROM users WHERE id = $1`, [req.userId]);
    const role = roleResult.rows[0]?.["role"] as string | undefined;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "MANAGER") {
      return res.status(403).json({ error: "forbidden" });
    }
    const result = await pool.query(
      `SELECT * FROM users ORDER BY created_at DESC LIMIT 500`
    );
    return res.json({ users: result.rows.map(normalizeUser) });
  } catch (err) {
    logger.error({ err }, "[users] Admin list failed");
    return res.status(500).json({ error: "list_failed" });
  }
});

// ─── POST /api/users/change-password ────────────────────────────────────────
router.post("/users/change-password", authMiddleware, async (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body as { oldPassword?: string; newPassword?: string };

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    const result = await pool.query(
      `SELECT up.password_hash FROM user_passwords up WHERE up.user_id = $1`,
      [req.userId]
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ error: "no_password" });
    }

    const valid = await bcrypt.compare(oldPassword, result.rows[0].password_hash as string);
    if (!valid) {
      return res.status(401).json({ error: "wrong_password", message: "كلمة المرور الحالية غير صحيحة" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE user_passwords SET password_hash = $1, updated_at = NOW() WHERE user_id = $2`,
      [newHash, req.userId]
    );

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[users] Change password failed");
    return res.status(500).json({ error: "change_password_failed" });
  }
});

export default router;
