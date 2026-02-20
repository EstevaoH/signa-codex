interface Location {
    id: string
    name: string
    description: string
    image_url: string
    owner_id: string
    campaign_id: string
    stats: {
        climate: string
        danger_level: string
        notes: string
    }
    is_visible: boolean
}