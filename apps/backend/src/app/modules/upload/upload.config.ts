import multer, { diskStorage, memoryStorage, Options} from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { validateImage } from '../../common/filters/file.filter';

type StorageType = 'memory' | 'disk';

const stores: { [key in StorageType]: multer.StorageEngine } = {
    'disk': diskStorage({
        destination: (req, file, callback) => {
            const uploadPath = './uploads';

            if (!existsSync(uploadPath)) {
                mkdirSync(uploadPath, { recursive: true });
            }

            callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
            callback(null, file.originalname); 
        }
    }),
    'memory': memoryStorage()
}

export const imageUploadConfig = (storageType: StorageType, sizeLimitMb = 1): Options => {
    return {
        storage: stores[storageType],
        fileFilter: validateImage,
        limits: {
            fileSize: sizeLimitMb * 1024 * 1024, 
        },
    }
};

