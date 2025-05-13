export interface CustomUser extends Document {
    _id: string;
    name: string;
    email: string;
    mobile: number;
    token: string;
    isActive: string
}

export interface CustomRequest extends Request {
    user?: CustomUser;
}