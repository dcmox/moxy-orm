import { DBModel } from 'DBModel'
import { IPost } from 'interfaces/interfaces'

export class Post extends DBModel {
	private props: IPost
	public constructor(fields?: IPost) {
		super(fields)
		if (fields) {
			this.props = fields
		} else {
			this.props = {
				id: 0,
				title: '',
				author: '',
				body: '',
				likes: 0,
			}
		}
	}
	public getId(): number {
		return this.props.id
	}
	public getTitle(): string {
		return this.props.title
	}
	public getAuthor(): string {
		return this.props.author
	}
	public getBody(): string {
		return this.props.body
	}
	public getLikes(): number | undefined {
		return this.props.likes
	}
	public setId(value: number): Post {
		this.props.id = value
		return this
	}
	public setTitle(value: string): Post {
		this.props.title = value
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
}

