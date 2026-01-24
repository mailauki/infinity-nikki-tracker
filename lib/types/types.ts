export interface EurekaSet {
	id: number;
	name: string;
	quality: number;
	style: string;
	labels: string;
	trial: string;
	slug: string;
	image_url: string;
	colors: Color[];
	categories: Category[];
}

export interface Quantity {
	name: string,
	trial?: string,
	obtained: number,
	total: number,
	colors: Count[],
	categories: Count[]
}

export interface Count {
	name?: string,
	obtained: number,
	total: number,
}

export interface EurekaColor {
	name: string;
	slug: string;
	image_url: string;
	obtained: boolean;
}

export interface Category {
	name: string;
	image_url: string;
	colors: EurekaColor[];
}

export interface Color {
	name: string;
	image_url: string;
}