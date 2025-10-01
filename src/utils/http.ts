// Helper function to make HTTP requests
export async function fetchJson(
	url: string,
	options?: RequestInit
): Promise<any> {
	const response = await fetch(url, options);
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	return response.json();
}
