export interface RegistryEntity {
	id: string;
	type: string | string[];
}

export interface Organization extends RegistryEntity {
	name: string;
	countryName?: string;
}

export interface Contact extends RegistryEntity {
	fn: string;
	email?: string;
	hasURL?: string;
}

export interface Cpp extends RegistryEntity {
	title: string;
}

export interface DataService extends RegistryEntity {
	title: string;
	description?: string;
	endpointURL: string;
	landingPage?: string;
	documentation?: string | string[];
	publisher?: Organization;
	contactPoint?: Contact[];
	containsProcess?: Cpp[];
	theme?: string[];
	keyword?: string[];
}