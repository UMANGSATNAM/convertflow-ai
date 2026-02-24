import { Session } from "@shopify/shopify-api";
import mysql from "mysql2/promise";

/**
 * Custom MySQL Session Storage for Shopify
 * Replaces PrismaSessionStorage to avoid Prisma engine crashes on shared hosting
 */
export class MySQLSessionStorage {
    constructor(connectionUrl) {
        this.connectionUrl = connectionUrl;
        this.pool = null;
        this.ready = this.init();
    }

    async init() {
        try {
            const url = new URL(this.connectionUrl);
            this.pool = mysql.createPool({
                host: url.hostname,
                port: parseInt(url.port) || 3306,
                user: decodeURIComponent(url.username),
                password: decodeURIComponent(url.password),
                database: url.pathname.slice(1),
                waitForConnections: true,
                connectionLimit: 5,
                queueLimit: 0,
            });

            // Verify connection
            const conn = await this.pool.getConnection();

            // Create Session table if it doesn't exist
            await conn.execute(`
                CREATE TABLE IF NOT EXISTS Session (
                    id                  VARCHAR(255) NOT NULL PRIMARY KEY,
                    shop                VARCHAR(255) NOT NULL,
                    state               VARCHAR(255) NOT NULL,
                    isOnline            BOOLEAN      NOT NULL DEFAULT FALSE,
                    scope               VARCHAR(255),
                    expires             DATETIME,
                    accessToken         VARCHAR(255) NOT NULL,
                    userId              BIGINT,
                    firstName           VARCHAR(255),
                    lastName            VARCHAR(255),
                    email               VARCHAR(255),
                    accountOwner        BOOLEAN      NOT NULL DEFAULT FALSE,
                    locale              VARCHAR(255),
                    collaborator        BOOLEAN      DEFAULT FALSE,
                    emailVerified       BOOLEAN      DEFAULT FALSE,
                    refreshToken        VARCHAR(255),
                    refreshTokenExpires DATETIME
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            conn.release();
            console.log("[MySQLSessionStorage] Connected and Session table verified");
        } catch (err) {
            console.error("[MySQLSessionStorage] Initialization failure:", err.message);
            throw err;
        }
    }

    async storeSession(session) {
        await this.ready;
        const entries = sessionToRow(session);

        const query = `
      INSERT INTO Session (id, shop, state, isOnline, scope, expires, accessToken, userId, firstName, lastName, email, accountOwner, locale, collaborator, emailVerified, refreshToken, refreshTokenExpires)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        shop = VALUES(shop),
        state = VALUES(state),
        isOnline = VALUES(isOnline),
        scope = VALUES(scope),
        expires = VALUES(expires),
        accessToken = VALUES(accessToken),
        userId = VALUES(userId),
        firstName = VALUES(firstName),
        lastName = VALUES(lastName),
        email = VALUES(email),
        accountOwner = VALUES(accountOwner),
        locale = VALUES(locale),
        collaborator = VALUES(collaborator),
        emailVerified = VALUES(emailVerified),
        refreshToken = VALUES(refreshToken),
        refreshTokenExpires = VALUES(refreshTokenExpires)
    `;

        await this.pool.execute(query, [
            entries.id,
            entries.shop,
            entries.state,
            entries.isOnline,
            entries.scope,
            entries.expires,
            entries.accessToken,
            entries.userId,
            entries.firstName,
            entries.lastName,
            entries.email,
            entries.accountOwner,
            entries.locale,
            entries.collaborator,
            entries.emailVerified,
            entries.refreshToken,
            entries.refreshTokenExpires,
        ]);

        return true;
    }

    async loadSession(id) {
        await this.ready;
        const [rows] = await this.pool.execute(
            "SELECT * FROM Session WHERE id = ?",
            [id]
        );

        if (!rows || rows.length === 0) return undefined;

        return rowToSession(rows[0]);
    }

    async deleteSession(id) {
        await this.ready;
        const [result] = await this.pool.execute(
            "DELETE FROM Session WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }

    async deleteSessions(ids) {
        await this.ready;
        if (!ids || ids.length === 0) return true;

        const placeholders = ids.map(() => "?").join(",");
        await this.pool.execute(
            `DELETE FROM Session WHERE id IN (${placeholders})`,
            ids
        );
        return true;
    }

    async findSessionsByShop(shop) {
        await this.ready;
        const [rows] = await this.pool.execute(
            "SELECT * FROM Session WHERE shop = ?",
            [shop]
        );
        return rows.map(rowToSession);
    }
}

function sessionToRow(session) {
    return {
        id: session.id,
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline ? 1 : 0,
        scope: session.scope || null,
        expires: session.expires ? new Date(session.expires) : null,
        accessToken: session.accessToken || "",
        userId: session.onlineAccessInfo?.associated_user?.id
            ? BigInt(session.onlineAccessInfo.associated_user.id)
            : null,
        firstName: session.onlineAccessInfo?.associated_user?.first_name || null,
        lastName: session.onlineAccessInfo?.associated_user?.last_name || null,
        email: session.onlineAccessInfo?.associated_user?.email || null,
        accountOwner: session.onlineAccessInfo?.associated_user?.account_owner ? 1 : 0,
        locale: session.onlineAccessInfo?.associated_user?.locale || null,
        collaborator: session.onlineAccessInfo?.associated_user?.collaborator ? 1 : 0,
        emailVerified: session.onlineAccessInfo?.associated_user?.email_verified ? 1 : 0,
        refreshToken: session.refreshToken || null,
        refreshTokenExpires: session.refreshTokenExpires ? new Date(session.refreshTokenExpires) : null,
    };
}

function rowToSession(row) {
    const sessionData = {
        id: row.id,
        shop: row.shop,
        state: row.state,
        isOnline: Boolean(row.isOnline),
        scope: row.scope || undefined,
        expires: row.expires ? new Date(row.expires) : undefined,
        accessToken: row.accessToken || "",
    };

    if (row.userId) {
        sessionData.onlineAccessInfo = {
            associated_user: {
                id: Number(row.userId),
                first_name: row.firstName || "",
                last_name: row.lastName || "",
                email: row.email || "",
                account_owner: Boolean(row.accountOwner),
                locale: row.locale || "",
                collaborator: Boolean(row.collaborator),
                email_verified: Boolean(row.emailVerified),
            },
        };
    }

    return new Session(sessionData);
}
