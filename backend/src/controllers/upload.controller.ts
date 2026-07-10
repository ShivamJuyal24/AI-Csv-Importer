import { Request, Response} from "express";
import { parseCsv } from "../services/csv.service";
export const uploadCsv = async(
    req: Request,
    res: Response
): Promise<void> =>{
    try{
        console.log("Controller reached");
        const file = req.file;

        if(!file){
            res.status(400).json({
                success: false,
                message: "CSV file is required."
            });
            return;
        }

        const rows = await parseCsv(file.buffer);
        res.status(200).json({
            success: true,
            message:"CSV recieved successfully.",
            totalRows: rows.length,
            data: rows,
        });
    }catch(error){
        console.log("Upload Error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}