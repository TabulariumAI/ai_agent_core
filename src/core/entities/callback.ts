
/**
 * The Callback enum is used to identify the type of callback being processed,
 * allowing for better organization and handling of callback requests.
 */
export class Callback {
    static readonly INDEX = "index";
    static readonly REPROCESS = "reprocess";
    static readonly CALC = "calc";
    static readonly PROVISION_INDEX = "provision/index";
    static readonly PROVISION_CALC = "provision/calc";
    static readonly REDACT = "redact";
    static readonly AUTOREDACT_INDEX = "autoredact/index";
    static readonly AUTOREDACT_REDACT = "autoredact/redact";
    static readonly ENDORSE = "endorse";
    static readonly AUTORECORD_INDEX = "autorecord/index";
    static readonly AUTORECORD_CALC = "autorecord/calc";
    static readonly AUTORECORD_REDACT = "autorecord/redact";
    static readonly AUTORECORD_ENDORSE = "autorecord/endorse";

}

/**
 * CallbackStatus is an enum representing the status of a callback operation.
 * It can be used to indicate whether the operation was successful, encountered an error, or is still processing.
 */
export enum CallbackStatus {
    COMPLETED = "completed",
    ERROR = "error",
    PROCESSING = "processing"
}

/**
 * CallbackTypes is an enum that categorizes different types of callbacks that can be received.
 * It helps in identifying the nature of the callback and processing it accordingly.
 */
export enum CallbackType {
    ChainJson,
    MetadataJson,
    RecordTiff,
    RecordPdf,
    ManifestTiff,
    ManifestPdf,
    ConfirmationPdf,
    ConfirmationTiff,
    RedactPdf,
    RedactTiff,
    PagePdf,
    PageTiff,
    Error,
    Empty,
}

/**
 * CallbackData is an interface that defines the structure of the data returned by a callback operation.
 * It includes a status to indicate the result of the operation and a data field for any additional information.
 */
export interface CallbackData {
    status: CallbackStatus,
    data: string
    types?: string
}