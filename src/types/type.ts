export interface Play {
    status: boolean;
    number_play: number;
}

export interface Prize {
    id: number;
    name: string;
    code: string;
    quantity: number;
    image: string;
    created_at: string;
    updated_at: string;
    index: number;
    msg?: string;
}

export interface Spin {
    message: string;
    prize: Prize;
    status: boolean;
    msg?: string;
}