import { DBModel } from '../DBModel'
import { IUser } from '../interfaces/interfaces'

export class User extends DBModel {
	private props: IUser
	public constructor(fields?: IUser) {
		super(fields)
		if (fields) {
			this.props = fields
		} else {
			this.props = {
				id: 0,
				name: '',
				age: 0,
				country: '',
			}
		}
		return this
	}
	public getId(): number {
		return this.props.id
	}
	public getName(): string {
		return this.props.name
	}
	public getAge(): number {
		return this.props.age
	}
	public getCountry(): string {
		return this.props.country
	}
	public setId(value: number): User {
		this.props.id = value
		return this
	}
	public setName(value: string): User {
		this.props.name = value
		return this
	}
	public setAge(value: number): User {
		this.props.age = value
		return this
	}
	public setCountry(value: string): User {
		this.props.country = value
		return this
	}
}

