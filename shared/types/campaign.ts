export interface Campaign {
    id: string;
    name: string;
    description: string;
    lore: string;
    system: string;
    genre: string;
    max_players: number;
    players: string[];
    status: string;
    master_id: string;
    image_url?: string;
    created_at?: string;
}