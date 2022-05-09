import type { NextFunction, Request, Response } from "express";

import { Property } from "../../model/framework/decorators/Property.js";

export class AuthMiddleware {
    @Property("API_ADMIN_TOKEN")
    static adminToken: string;

    static isAdmin(req: Partial<Request>, res: Partial<Response>, next: NextFunction): void {
        const token = req.headers?.["authorization"];
        if (token === AuthMiddleware.adminToken) {
            next();
        } else {
            res.status?.(401).send({ code: 401, error: "Invalid Authorization Token" });
        }
    }
}
