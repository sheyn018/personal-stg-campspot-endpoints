import dotenv from "dotenv";
import { Request, Response } from "express";
import { fixDateIfInvalid } from "../utils/fixDateIfInvalid";

dotenv.config();

export async function GETSearchRoomAvailable(req: Request, res: Response) {
    try {
        let { 
            parkId, 
            site, 
            checkin, 
            checkout, 
            adults, 
            children, 
            pets,
            length,
            slideout, 
            equipmentType,
        } = req.query;

        // Decoding the variables
        parkId = decodeURIComponent(parkId);
        site = decodeURIComponent(site);
        checkin = decodeURIComponent(checkin);
        checkout = decodeURIComponent(checkout);
        adults = decodeURIComponent(adults);
        children = decodeURIComponent(children);
        pets = decodeURIComponent(pets);
        length = decodeURIComponent(length);
        slideout = decodeURIComponent(slideout);
        equipmentType = decodeURIComponent(equipmentType);

        const baseUrl = "https://insiderperks.com/wp-content/endpoints/campspot-staging/search-room-available.php";
        const [validCheckin, validCheckout] = await Promise.all([
            fixDateIfInvalid(checkin as string),
            fixDateIfInvalid(checkout as string),
        ]);

        const params: any = {
            id: parkId,
            checkin: validCheckin,
            checkout: validCheckout,
            adults: adults,
            children: children,
            pets: pets,
            length: length,
            slideout: slideout,
            equipmentType: equipmentType,
        };

        const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

        const urlWithParams = `${baseUrl}?${queryString}`;

        console.log(urlWithParams);

        let jsonResponse;

        try {
            const response = await fetch(urlWithParams);
            jsonResponse = await response.json();
        }

        catch (error) {
            return res.status(500).send("Error processing the request");
        }

        if (!jsonResponse || !jsonResponse.data || jsonResponse.data.length === 0) {
            return 'No results found.';
        }

        let campsites = jsonResponse.data;
        let failureReasons: any = [];
        let filteredCampsites: any = [];

        const look = site.toLowerCase();
        const petsCheck = parseInt(params.pets);
        const userRVLength = length;
        const userRVType = equipmentType.toLowerCase();
        const userRVSlideoutLabel = slideout.toLowerCase();
        let userRVSlideoutValue;

        if (userRVSlideoutLabel === "both sides") {
           userRVSlideoutValue = 2;
        }
        else if (userRVSlideoutLabel === "driver side" || userRVSlideoutLabel === "passenger side" || userRVSlideoutLabel === "one side") {
            userRVSlideoutValue = 1;
        }
        else {
            userRVSlideoutValue = 0;
        }

        for (const campsite of campsites) {
            const siteType = campsite.campsiteCategoryCode;
            const availability = campsite.availability;
            const isPetFriendly = String(campsite.isPetFriendly ?? false);

            if (siteType === look && availability === "AVAILABLE") {
              // User does not have pets
              if (petsCheck === 0) {
                const { id, name, description, averagePricePerNight, totalTripPrice, amenities } = campsite;
                const imageUrl = campsite.images.mainImage.medium.url;
                const slideShow = campsite.images.slideshowImages.map((image: { medium: { url: any; }; }) => image.medium.url);
                const petFriendly = String(campsite.isPetFriendly);
                let combinedDescription = `${description} Amenities include: ${amenities.join(", ")}.`;

                const filteredCampsite: {
                    id: any;
                    name: any;
                    description: any;
                    type: any;
                    amenities: any;
                    petFriendly: any;
                    averagePricePerNight: any;
                    totalTripPrice: any;
                    rvInfo?: any;
                    imageUrl: any;
                    slideShow: any;
                } = {
                    id,
                    name,
                    description: combinedDescription,
                    type: siteType,
                    amenities,
                    petFriendly,
                    averagePricePerNight,
                    totalTripPrice,
                    imageUrl,
                    slideShow
                };
                
                // RV-specific filtering
                if (siteType === "rv") {
                    const rvInfo = campsite.campsites[0].rvInfo;
                    const minLength = parseFloat(rvInfo.rvLengthMin);
                    const maxLength = parseFloat(rvInfo.rvLengthMax);
                    const userLength = parseFloat(userRVLength);
                    const userSlideout = userRVSlideoutValue;

                    if (!isNaN(minLength) && !isNaN(maxLength) && !isNaN(userLength)) {
                        if (
                            userLength >= minLength &&
                            userLength <= maxLength &&
                            userSlideout <= parseFloat(rvInfo.rvSlideoutValue) &&
                            (typeof rvInfo.rvTypes === 'string' 
                                ? rvInfo.rvTypes.toLowerCase().includes(userRVType.toLowerCase())
                                : Array.isArray(rvInfo.rvTypes) 
                                    ? rvInfo.rvTypes.some((type: string) => type.toLowerCase().includes(userRVType.toLowerCase()))
                                    : false)
                        )
                        {
                            filteredCampsite.rvInfo = {
                                ...rvInfo,
                                slideout: rvInfo.rvSlideoutValue === 2 ? "both sides" : rvInfo.rvSlideoutValue === 1 ? "one side" : "none",
                            };
                            filteredCampsites.push(filteredCampsite);
                        }
                    }
                } 
                
                // Lodge data
                else {
                    filteredCampsites.push(filteredCampsite);
                }
              }

              // User has pets
              else {
                if (isPetFriendly === "true") {
                    const { id, name, description, averagePricePerNight, totalTripPrice, amenities } = campsite;
                    const imageUrl = campsite.images.mainImage.medium.url;
                    const slideShow = campsite.images.slideshowImages.map((image: { medium: { url: any; }; }) => image.medium.url);
                    const petFriendly = String(campsite.isPetFriendly);
                    let combinedDescription = `${description} Amenities include: ${amenities.join(", ")}.`;

                    const filteredCampsite: {
                        id: any;
                        name: any;
                        description: any;
                        type: any;
                        amenities: any;
                        petFriendly: any;
                        averagePricePerNight: any;
                        totalTripPrice: any;
                        rvInfo?: any;
                        imageUrl: any;
                        slideShow: any;
                    } = {
                        id,
                        name,
                        description: combinedDescription,
                        amenities,
                        petFriendly,
                        type: siteType,
                        averagePricePerNight,
                        totalTripPrice,
                        imageUrl,
                        slideShow
                    };

                    // RV-specific filtering
                    if (siteType === "rv") {
                        const rvInfo = campsite.campsites[0].rvInfo;
                        const minLength = parseFloat(rvInfo.rvLengthMin);
                        const maxLength = parseFloat(rvInfo.rvLengthMax);
                        const userLength = parseFloat(userRVLength);
                        const userSlideout = userRVSlideoutValue;

                        if (!isNaN(minLength) && !isNaN(maxLength) && !isNaN(userLength)) {
                            if (
                                userLength >= minLength &&
                                userLength <= maxLength &&
                                userSlideout <= parseFloat(rvInfo.rvSlideoutValue) &&
                                (typeof rvInfo.rvTypes === 'string' 
                                    ? rvInfo.rvTypes.toLowerCase().includes(userRVType.toLowerCase())
                                    : Array.isArray(rvInfo.rvTypes) 
                                        ? rvInfo.rvTypes.some((type: string) => type.toLowerCase().includes(userRVType.toLowerCase()))
                                        : false)
                            )
                            {
                                filteredCampsite.rvInfo = {
                                    ...rvInfo,
                                    slideout: rvInfo.rvSlideoutValue === 2 ? "both sides" : rvInfo.rvSlideoutValue === 1 ? "one side" : "none",
                                };
                                filteredCampsites.push(filteredCampsite);
                            }
                        }
                    } 
                    
                    // Lodge data
                    else {
                        filteredCampsites.push(filteredCampsite);
                    }
                }
              }
            }

            if (
                campsite.failureReasons &&
                campsite.failureReasons.length > 0 &&
                siteType === look
            ) 
            {
                failureReasons.push(...campsite.failureReasons);
            }
        }

        // Getting specific reasons for failure
        const exactReason = failureReasons.length > 0 ? failureReasons : ["None"];

        // Retrieved valid campsites
        if (filteredCampsites.length > 0) {
            return res.send({ responsePayload: filteredCampsites });
        }

        // No valid campsites
        else {
            return res.send({ responsePayload: exactReason });
        }
    }
    
    catch (error: any) {
        return res.status(500).send("Error processing the request");
    }
}
