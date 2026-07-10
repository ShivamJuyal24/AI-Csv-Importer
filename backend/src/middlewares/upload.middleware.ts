import multer from "multer";

// Set up multer storage configuration
const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (req, file, cb)=>{
    // Check the file type
    const allowedMimeTypes = [
        "text/csv",
        "application/vnd.ms-excel",
    ];

    if(allowedMimeTypes.includes(file.mimetype)){
        cb(null, true);
        return;
    }

    cb(new Error("only CSV file are allowed."));
};

// Create the multer upload middleware
export const upload = multer({
    storage,
    fileFilter,
    limits:{
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    }
});