import { Request, Response} from "express";

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

        
        res.status(200).json({
            success: true,
            message:"CSV recieved successfully.",
            file:{
                originalname: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
            },
        });
    }catch(error){
        console.log("Upload Error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}