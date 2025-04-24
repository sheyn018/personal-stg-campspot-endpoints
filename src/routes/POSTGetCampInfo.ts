import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export async function POSTGetCampInfo(req: Request<{ camp_id: string }>, res: Response) {

    try {
        console.log(`startin..`)
        const inputVars: any = req.body;
        const parkId = inputVars?.parkId || req.params.camp_id || "92";

        const baseUrl = "https://insiderperks.com/wp-content/endpoints/campspot-staging/park-meta.php";
        const placeholder = '1';

        const params: any = {
            parkId: req.params.camp_id || parkId || "92",
        };

        // Convert the parameters to a query string
        const queryString = Object.keys(params)
            .filter(key => params[key] !== undefined) // Ensure only defined parameters are included
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        // Append the query string to the URL
        const urlWithParams = `${baseUrl}?${queryString}`;
        console.log(`url with params.`, urlWithParams)

        const response = await fetch(urlWithParams);

        console.log(response);

        let camp_meta: any = await response.text();
        camp_meta = JSON.parse(camp_meta);
        let camp_data = camp_meta.data;
        let park = camp_data.park;

        const latitude = park.latitude;
        const longitude = park.longitude;
        const mapUrl = park.mapUrl;
        const campEmail = park.email;
        const campContact = park.phoneNumber;

        return res.json({
            latitude: latitude,
            longitude: longitude,
            mapUrl: mapUrl,
            campEmail: campEmail,
            campContact: campContact
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error });
    }

}


