interface Item {
    id: string
    name: string
    description: string
    rarity: string
    type: string
    value: number
    weight: number
    campaign_id: string
    properties?: {
        value?: number
        weight?: number
    }
    notes?: string
}