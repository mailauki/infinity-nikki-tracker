export interface Eureka {
	id: number;
	name: string;
	quality: number;
	style: string;
	labels: string;
	trial: string;
	colors: {
		name: string;
	}[];
	image_url: string;
	categories: {
		name: string;
		image_url: string;
		colors: {
			name: string;
			slug: string;
			image_url: string;
			obtained: boolean;
		}[];
	}[];
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