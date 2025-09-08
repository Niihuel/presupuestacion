import { NextResponse } from "next/server";
import { Loader } from "@googlemaps/js-api-loader";

export async function POST(req: Request) {
	const { origins, destinations, apiKey } = await req.json();
	const key = apiKey || process.env.GOOGLE_MAPS_API_KEY;
	if (!key) return NextResponse.json({ error: "Missing API key" }, { status: 400 });
	const loader = new Loader({ apiKey: key, version: "weekly", libraries: ["routes"] as any });
	const { DistanceMatrixService } = await loader.importLibrary("routes");
	const svc = new (DistanceMatrixService as any)();
	const res = await svc.getDistanceMatrix({
		origins,
		destinations,
		travelMode: 'DRIVING' as any, // Use string instead of enum
	});
	return NextResponse.json(res);
}


