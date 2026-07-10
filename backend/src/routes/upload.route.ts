import { Router} from 'express'
import { upload} from '../middlewares/upload.middleware';
import { uploadCsv} from '../controllers/upload.controller';
const router = Router();

router.post('/', upload.single('file'), uploadCsv);

export default router;