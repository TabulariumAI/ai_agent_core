import { Service, Token } from 'typedi';

/**
 * Service for determining file types based on MIME types.
 */
@Service()
export class FileTypeService {
    
    /**
     * A map of MIME types to their corresponding file types.
     * This map is used to determine the file type based on the content type.
     */
    private readonly mimeTypes: Map<string, string> = new Map([
        ["application/pdf", "pdf"],
        ['image/tiff', "tiff"]
    ]);
    
    /**
     * Retrieves the file type based on the provided content type.
     * 
     * @param contentType - The MIME type of the file.
     * @returns The corresponding file type
     * @throws Error if the content type is unsupported.
     */
    getFileType(contentType: string): string {
        const type = this.mimeTypes.get(contentType.trim().toLowerCase());
        if (!type) {
            throw new Error(`Unsupported file type: ${contentType}`);
        }
        return type;
    }

    /** Validates if the provided file type is supported.
     * 
     * @param fileType - The file type to validate.
     * @returns True if the file type is supported, false otherwise.
     */
    validateFileType(fileType: string): boolean {
        return Array.from(this.mimeTypes.values()).includes(fileType.trim().toLowerCase());
    }

    /** Determines if the provided file type is PDF.
     * 
     * @param fileType - The file type to check.
     * @returns True if the file type is PDF, false otherwise.
     */
    isPdf(fileType: string): boolean {
        let type = fileType.trim().toLowerCase();
        const isValid = this.validateFileType(type);
        return !isValid || type === "pdf";
    }

    /** Determines if the provided file type is TIFF.
     * 
     * @param fileType - The file type to check.
     * @returns True if the file type is TIFF, false otherwise.
     */
    isTiff(fileType: string): boolean {
        let type = fileType.trim().toLowerCase();
        const isValid = this.validateFileType(type);
        return !isValid || type === "tiff";
    }



}

