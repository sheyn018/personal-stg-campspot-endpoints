import express from 'express';
import path from 'path';
import { GETSearchRoomAvailable } from './routes/GETSearchRoomAvailable';
import { POSTGetCampInfo } from './routes/POSTGetCampInfo';
import { GETSaveCustomer } from './routes/GETSaveCustomer';
import { GETAddCart } from './routes/GETAddCart';
import { GETCamps } from './routes/GetCamps';
const app = express();
const port = process.env.PORT || 8787;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.get('/', (req, res) => {
	res.send(`INSIDER PERKS EXPRESS, BUILD WITH BUN`);
});

// depracated..
app.post('/random/insider-perks/camps-availability', GETSearchRoomAvailable as any); // get-sites function
app.post('/random/insider-perks/camps/:camp_id', POSTGetCampInfo as any);

// new routes
app.get("/api/save-customer", GETSaveCustomer as any);

app.get("/api/add-cart", GETAddCart as any);

app.get('/api/sites', GETSearchRoomAvailable as any); // get-sites function

// app.post('/api/sites', POSTSearchRoomAvailable as any); // get-sites function


app.get("/api/camps", GETCamps as any);

app.get("/api/customer-details",);

app.post("/api/camps/:camp_id", POSTGetCampInfo as any);

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});