import { Request, Response } from "express";

export async function GETSaveCustomer(req: Request, res: Response) {

    const inputVars: any = req.query;
    // const { parkId, shoppingCartUuid } = inputVars;
    try {
        let {
            parkId,
            parkSlug,
            shoppingCartUuid,
            guestName,
            guestEmail,
            guestPhone,
            shippingName,
            shippingState,
            shippingType,
            shippingCountry,
            shippingCity,
            shippingAddress1,
            shippingPostalCode,
            smsMessage,
            minPayment,
            sourceReferral,
            reasonStay,
            bookingNeed,
            environment,
        }: any = req.query;

        // Decoding the variables
        parkId = decodeURIComponent(parkId);
        parkSlug = decodeURIComponent(parkSlug);
        shoppingCartUuid = decodeURIComponent(shoppingCartUuid);
        guestName = decodeURIComponent(guestName);
        guestEmail = decodeURIComponent(guestEmail);
        guestPhone = decodeURIComponent(guestPhone);
        shippingName = decodeURIComponent(shippingName);
        shippingState = decodeURIComponent(shippingState);
        shippingType = 'SHIPPING';
        shippingCountry = decodeURIComponent(shippingCountry);
        shippingCity = decodeURIComponent(shippingCity);
        shippingAddress1 = decodeURIComponent(shippingAddress1);
        shippingPostalCode = decodeURIComponent(shippingPostalCode);
        smsMessage = decodeURIComponent(smsMessage);
        minPayment = decodeURIComponent(minPayment);
        sourceReferral = decodeURIComponent(sourceReferral);
        reasonStay = decodeURIComponent(reasonStay);
        bookingNeed = decodeURIComponent(bookingNeed);

        console.log("Environment Save Customer:", req.query.environment);
        environment = decodeURIComponent(environment) || "campspot-staging";

        // // First API call: save customer details
        const saveCustomerUrl = `https://insiderperks.com/wp-content/endpoints/${environment}/save-customer.php`;
        const customerData = {
            parkId,
            shoppingCartUuid,
            guestName,
            guestEmail,
            guestPhone,
            shippingName,
            shippingState,
            shippingType,
            shippingCountry,
            shippingCity,
            shippingAddress1,
            shippingPostalCode,
            smsMessage
        };

        console.log(customerData);

        let guestId = '';
        let status = 'failed';

        // try {
        //     const response = await fetch(saveCustomerUrl, {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify(customerData)
        //     });
        //     const details = await response.json();

        //     if (response.ok && details.httpCode === 200) {
        //         status = "success";
        //         guestId = details.apiResponse.guest.id;
        //     } else {
        //         status = "failed";
        //     }
        // }

        // catch (error: any) {
        //     status = error.message;
        // }

        // Second API call: calculate subtotal
        const baseUrl = `https://insiderperks.com/wp-content/endpoints/${environment}/get-cart-checkout.php`;
        const params: any = { cartId: shoppingCartUuid, parkId: parkId };
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        const urlWithParams = `${baseUrl}?${queryString}`;

        let finalTotal;

        try {
            const response = await fetch(urlWithParams);
            const cart = await response.json();

            const grandTotal = cart.cart.parkShoppingCarts[parkId].grandTotal || 0;
            
            finalTotal = grandTotal;
        }
        catch (error) {
            return res.status(500).send(error);
        }

        function encryptData(data: any) {
            // Use shorter property names
            const minData = {
                n: data.name, // name
                e: data.email, // email
                p: data.phone, // phone
                s: data.state, // state
                c: data.country, // country
                ct: data.city, // city
                a: data.address1, // address1
                pc: data.postalCode, // postalCode
                sm: data.smsMessage, // smsMessage
                sr: data.sourceReferral, // sourceReferral
                rs: data.reasonStay, // reasonStay
                bn: data.bookingNeed, // bookingNeed
                env: environment // environment
            };
            
            // Remove whitespace from JSON
            const jsonString = JSON.stringify(minData);
            return btoa(jsonString); // Base64 encode as before
        }

        // Data to encode
        const sensitiveData = {
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
            state: shippingState,
            country: shippingCountry,
            city: shippingCity,
            address1: shippingAddress1,
            postalCode: shippingPostalCode,
            smsMessage: smsMessage,
            sourceReferral: sourceReferral,
            reasonStay: reasonStay,
            bookingNeed: bookingNeed
        };

        // Encode data
        const encryptedToken = encryptData(sensitiveData);

        // Build clean URL with only `parkId`, `cartId`, and `token`
        const cardConnectUrl = `https://personal-stg-campspot-checkout-page.onrender.com/booking-checkout.php?parkId=${encodeURIComponent(parkId)}&parkSlug=${encodeURIComponent(parkSlug)}&cartId=${encodeURIComponent(shoppingCartUuid)}&token=${encodeURIComponent(encryptedToken)}`;

        console.log("Secure URL:", cardConnectUrl);

        return res.send({ status, /*guestId,*/ finalTotal, cardConnectUrl });
    }

    catch (error) {
        return res.status(500).send("Error processing the request");
    }
}
