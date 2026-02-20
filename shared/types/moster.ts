interface Monster {
    name: string;
    description: string;
    type: string;
    stats: {
        challenge_rating: string;
        hit_points: string;
        armor_class: string;
    };
    actions: []
    isGlobal: boolean;
    image: string;
    notes: string;
    campaignId: string;
    status: string;
}