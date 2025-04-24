import { Request, Response } from "express";

export async function TEMPLATE(req: Request, res: Response) {
    const query: any = req.query; // always work
    const body: any = req.body; // only works in post
    
}


