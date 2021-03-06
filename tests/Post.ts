import { DBModel } from '../lib/DBModel'

interface IPost {
	date: Date,
	author_id: number,
	author: string,
	body: string,
	likes: number,
	comments: any[],
}

export class Post extends DBModel {
	private props: IPost
	public constructor(fields?: IPost) {
		super(fields)
		if (fields) {
			this.props = fields
		} else {
			this.props = {
				date: new Date(),
				author_id: 0,
				author: '',
				body: '',
				likes: 0,
				comments: [],
			}
		}
		return this
	}
	public getDate(): Date {
		return this.props.date
	}
	public getAuthor_id(): number {
		return this.props.author_id
	}
	public getAuthor(): string {
		return this.props.author
	}
	public getBody(): string {
		return this.props.body
	}
	public getLikes(): number {
		return this.props.likes
	}
	public getComments(): any[] {
		return this.props.comments
	}
	public setDate(value: Date): Post {
		this.props.date = value
		return this
	}
	public setAuthor_id(value: number): Post {
		this.props.author_id = value
		return this
	}
	public setAuthor(value: string): Post {
		this.props.author = value
		return this
	}
	public setBody(value: string): Post {
		this.props.body = value
		return this
	}
	public setLikes(value: number): Post {
		this.props.likes = value
		return this
	}
	public setComments(value: any[]): Post {
		this.props.comments = value
		return this
	}
}

