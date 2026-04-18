import * as Entities from "../../../core/entities/imports";

export const autoRedactChoice: Entities.Choice = {
    items: [
        {
            service: 'Recognition',
            level: 6
        },
        {
            service: 'ConfidentialIndexing',
            level: 1
        }

    ]
}