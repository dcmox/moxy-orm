export interface IUser {
    id: number,
    name: string,
    age: number,
    country: string,
}

export interface IPost {
    id: number,
    title: string,
    author: string,
    body: string,
    likes?: number,
}

