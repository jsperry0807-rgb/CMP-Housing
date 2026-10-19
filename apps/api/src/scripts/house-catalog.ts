/**
 * The house catalog shared by the two seeders:
 *
 *   - `seed.ts`          the demo teams + these houses as `active` designs
 *   - `seed-history.ts`  the historical showcase, credited to "Unknown Student"
 *                        and marked `not-for-sale`
 *
 * Photos are read from `apps/api/seed-images/<image path>/` when that folder
 * exists (last year's layout: 01.jpg, 02.jpg, …) and copied into `uploads/`
 * under stable slug names, so a re-seed never duplicates files.
 */
import { copyFileSync, existsSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "../lib/slug.js";
import { UPLOAD_DIR, uploadUrl } from "../lib/uploads.js";
import type { IListingEntry } from "../models/listing.js";

export interface SeedHouse {
  name: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  totalCost: number;
  beds: number;
  baths: number;
  sqft: number;
  description: string;
  year: number;
  propertyTax?: number;
  assessment?: number;
  maps: { location: string; schools: string; shops: string };
  highlights: IListingEntry[];
  interior: IListingEntry[];
  roomTypes: string[];
  /** Folder name under apps/api/seed-images. */
  imagePath: string;
  /** Key into the demo `TEAMS` (ignored by the historical seeder). */
  team: string;
}

export const HOUSES: SeedHouse[] = [
  {
    name: "Barn Brothers",
    address: {
      line1: "101 SW Western Blvd",
      city: "Corvallis",
      state: "OR",
      postalCode: "97333",
    },
    totalCost: 500000,
    beds: 5,
    baths: 3.5,
    sqft: 3334,
    description:
      "This house is a very nice family home. This house has a lot of storage and a sauna and a movie theater room. Also the house is on a hill not crowded with other houses and in the country. Has a big back yard and a wrap around front porch.",
    year: 2022,
    propertyTax: 8089,
    assessment: 316956,
    maps: {
      location:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d815.8067477986793!2d-106.53703313578791!3d35.12600859534286!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87227557938908eb%3A0x723dd3cf63dbb051!2s3828%20Piermont%20Dr%20NE%2C%20Albuquerque%2C%20NM%2087111!5e0!3m2!1sen!2sus!4v1674496485968!5m2!1sen!2sus",
      schools:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d6526.45398882412!2d-106.54087540526388!3d35.12600851504304!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sschool!5e0!3m2!1sen!2sus!4v1674496529574!5m2!1sen!2sus",
      shops:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d6526.454001435586!2d-106.54089686316917!3d35.12600835766182!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sshop%20%26%20eat!5e0!3m2!1sen!2sus!4v1674496557708!5m2!1sen!2sus",
    },
    highlights: [
      { label: "Parking", value: "Garage" },
      { label: "Outdoor", value: "Porch" },
      { label: "AC", value: "Both" },
      { label: "HOA", value: "None" },
      { label: "Listed", value: "12 days ago" },
      { label: "Price/sqft", value: "$150" },
    ],
    interior: [
      { label: "Basement", value: "Full, Exterior Entry" },
      { label: "Rooms", value: "4" },
      { label: "Bathrooms (full)", value: "3" },
      { label: "Dimensions & Layout", value: "3,328 sqft" },
    ],
    roomTypes: ["Theater Room", "Utility Room", "Storage Room", "Lounge Room"],
    imagePath: "Barn Brothers",
    team: "timberline",
  },
  {
    name: "Barn Renovation Organization",
    address: {
      line1: "14194 Newton Town Rd",
      city: "Centerville",
      state: "PA",
      postalCode: "16404",
    },
    totalCost: 782700,
    beds: 5,
    baths: 3.75,
    sqft: 5218,
    description:
      "What once was a barn is now a huge lovely home with a rustic interior design. This property includes an in-law house, 3 car garage, and a 10 car parking lot, all with the gorgeous renovated barn house. This house is banked into a hill but has elevated ceilings, an indoor balcony, a custom breakfast bar, and all the space you would need.",
    year: 2022,
    propertyTax: 15654,
    assessment: 496200,
    maps: {
      location:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2980.44999735175!2d-79.76265708456545!3d41.66762397923951!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8832e9c9b2212b5d%3A0xce412b5d928ddacb!2s14194%20Newton%20Town%20Rd%2C%20Centerville%2C%20PA%2016404!5e0!3m2!1sen!2sus!4v1674667418483!5m2!1sen!2sus",
      schools:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d190601.0306887836!2d-79.87360871281926!3d41.71747391954905!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sschools!5e0!3m2!1sen!2sus!4v1674667482896!5m2!1sen!2sus",
      shops:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d190600.0151114845!2d-79.87360888517861!3d41.71781635632237!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sshop%20%26%20eat!5e0!3m2!1sen!2sus!4v1674668187112!5m2!1sen!2sus",
    },
    highlights: [
      { label: "Parking", value: "Garage" },
      { label: "Outdoor", value: "Fireplace" },
      { label: "AC", value: "Central Air Conditioning" },
      { label: "HOA", value: "None" },
      { label: "Listed", value: "January 2, 2023" },
      { label: "Window", value: "Large Octogonal Window" },
      { label: "Layout", value: "Open Interior Layout" },
      { label: "Price/sqft", value: "$150" },
    ],
    interior: [
      { label: "Basement", value: "Full, Exterior Entry" },
      { label: "Rooms", value: "10" },
      { label: "Bathrooms (full)", value: "2" },
      { label: "Dimensions & Layout", value: "5,218 sqft" },
    ],
    roomTypes: [
      "Game Room",
      "Theatre Room",
      "Trophy Room",
      "Storage Room",
      "2 Living Rooms",
      "2 Kitchens/Dinning Rooms",
      "Office",
      "Man Cave",
    ],
    imagePath: "Barn Rennovation Organization",
    team: "timberline",
  },
  {
    name: "Beyond Barn Architecture",
    address: {
      line1: "7371 PA-832",
      city: "Fairview",
      state: "PA",
      postalCode: "16415",
    },
    totalCost: 680000,
    beds: 2,
    baths: 2.5,
    sqft: 4536,
    description:
      "What was once previously a barn has transformed into a comfortable, welcoming home. The house has a large yard in both the back and front, with a pond, and a large wooded area. The house features vaulted ceilings and two large cathedral arch windows on the main floor and has a finished basement.",
    year: 2022,
    propertyTax: 1217,
    assessment: 431000,
    maps: {
      location:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d23721.652013780127!2d-80.24105765884676!3d41.99584356165154!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88327ecfa9a21d2b%3A0xe5caddbd69fa2918!2sPA-832%2C%20Fairview%2C%20PA%2016415!5e0!3m2!1sen!2sus!4v1674501066291!5m2!1sen!2sus",
      schools:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d23721.653005532422!2d-80.24114349291696!3d41.99584090088427!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sschool!5e0!3m2!1sen!2sus!4v1674501111129!5m2!1sen!2sus",
      shops:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d94886.64588836917!2d-80.29388757217035!3d41.99581818599!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sshop%20%26%20eat!5e0!3m2!1sen!2sus!4v1674501144924!5m2!1sen!2sus",
    },
    highlights: [
      { label: "Parking", value: "4-Car Garage" },
      { label: "Outdoor", value: "Patio" },
      { label: "AC", value: "Geothermal Heating, Solar Panels" },
      { label: "HOA", value: "None" },
      { label: "Price/sqft", value: "$150" },
      { label: "Listed", value: "12/25/22" },
    ],
    interior: [
      { label: "Basement", value: "Full, Exterior Entry" },
      { label: "Rooms", value: "7" },
      { label: "Bathrooms (full)", value: "2" },
      { label: "Dimensions & Layout", value: "4,536 sqft" },
    ],
    roomTypes: ["Kitchen", "Living Room", "Dining Room", "Beds & Baths"],
    imagePath: "Beyond Barn Architecture",
    team: "timberline",
  },
  {
    name: "Bil & Law Architecture",
    address: {
      line1: "8930 Francis Rd",
      city: "Girard",
      state: "PA",
      postalCode: "16417",
    },
    totalCost: 536550,
    beds: 3,
    baths: 3,
    sqft: 3577,
    description:
      "This lovely renovated barn country home has a 3 car garage. An open floor concept is seen when walking into the house with a nice L-shaped kitchen including an island. In the living room you will find the stairs leading up to the loft, looking over the kitchen. Off the kitchen you will find another room that is a very inviting sunroom. You will see the 3 bedrooms down the hall along with a bathroom. The basement has a very huge man-cave with a winery adjacent.",
    year: 2022,
    propertyTax: 8680,
    assessment: 340126,
    maps: {
      location:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2966.754073618686!2d-80.28213448455624!3d41.962617079215555!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88326ff4da13058d%3A0xb4ad08114df37a38!2s8930%20Francis%20Rd%2C%20Girard%2C%20PA%2016417!5e0!3m2!1sen!2sus!4v1674674330253!5m2!1sen!2sus",
      schools:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d47468.0186388744!2d-80.3149650774673!3d41.96267954907874!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sschool!5e0!3m2!1sen!2sus!4v1674674382718!5m2!1sen!2sus",
      shops:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d47467.93147315347!2d-80.31496508819792!3d41.96279655241566!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sshop%20%26%20eat!5e0!3m2!1sen!2sus!4v1674674412888!5m2!1sen!2sus",
    },
    highlights: [
      { label: "Parking", value: "Garage" },
      { label: "Outdoor", value: "Backporch, Sunroom" },
      { label: "AC", value: "Central air" },
      { label: "HOA", value: "None" },
      { label: "Price/sqft", value: "$150" },
      { label: "Listed", value: "8 days ago" },
    ],
    interior: [
      { label: "Basement", value: "Full" },
      { label: "Rooms", value: "1" },
      { label: "Bathrooms (full)", value: "2" },
    ],
    roomTypes: ["Man-cave"],
    imagePath: "Bil & Law Architecture",
    team: "keystone",
  },
  {
    name: "Bon Jour Barns",
    address: {
      line1: "885 Barkeyville Rd",
      city: "Pine Township",
      state: "PA",
      postalCode: "16127",
    },
    totalCost: 597000,
    beds: 4,
    baths: 3.5,
    sqft: 3977,
    description:
      "A lovely 2 story house with a finished basement, located on 10.7 acres, and has a 3 car garage. An L-shaped kitchen with stainless steel appliances, granite countertops, and a ton of accessible storage. The laundry room, an office, along with the master suite are offered on the first floor. The 2nd story consists of 2 beds and a Jack-and-Jill bath, along with an additional seating area, and a loft with an outlook into the main living area.",
    year: 2022,
    propertyTax: 9658,
    assessment: 378446,
    maps: {
      location:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d24729.136314883286!2d-80.06378617778195!3d41.17504273801766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88330b2dd5769da3%3A0xf9c8b7c5ff629bc2!2s885%20Barkeyville%20Rd%2C%20Grove%20City%2C%20PA%2016127!5e0!3m2!1sen!2sus!4v1674758888246!5m2!1sen!2sus",
      schools:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d24025.12261374147!2d-80.06378618065904!3d41.17510642697829!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sschools!5e0!3m2!1sen!2sus!4v1674758919696!5m2!1sen!2sus",
      shops:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d24025.099891478207!2d-80.06378618337462!3d41.17516838046618!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sshop%20%26%20eat!5e0!3m2!1sen!2sus!4v1674758950712!5m2!1sen!2sus",
    },
    highlights: [
      { label: "Parking", value: "Garage" },
      { label: "Outdoor", value: "Front Porch, Deck" },
      { label: "AC", value: "Central Air" },
      { label: "HOA", value: "None" },
      { label: "Price/sqft", value: "$150" },
      { label: "Listed", value: "8 days ago" },
    ],
    interior: [
      { label: "Basement", value: "Full, Exterior Entry" },
      { label: "Rooms", value: "4" },
      { label: "Bathrooms (full)", value: "3" },
      { label: "Dimensions & Layout", value: "3,977 sqft" },
    ],
    roomTypes: ["1 Full Bath", "Bar/entertainment", "Mudroom", "Man cave"],
    imagePath: "Bon Jour Barns",
    team: "keystone",
  },
  {
    name: "J-Designs",
    address: {
      line1: "42 Old Kalanianaole Rd",
      city: "Waimanalo",
      state: "HI",
      postalCode: "96795",
    },
    totalCost: 525300,
    beds: 4,
    baths: 5,
    sqft: 3502,
    description:
      "This barn home features three separate stories, as well as a basement area. Barstools are equipped within the large kitchen, as well as lots of lighting, natural and artificial. There is a separate garage located next to the house that has another floor dedicated to storage. Finally, there is a back patio, as well as a porch that's very nice for when it's nice out.",
    year: 2022,
    propertyTax: 3357,
    maps: {
      location:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4418.42302596425!2d-157.74794001603394!3d21.37272434022153!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c0014bb73ec9a51%3A0xa3888be6ef5cdc1e!2s42%20Old%20Kalanianaole%20Rd%2C%20Kailua%2C%20HI%2096734!5e0!3m2!1sen!2sus!4v1674759057615!5m2!1sen!2sus",
      schools:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d14861.74203509357!2d-157.7540919735019!3d21.372750015931807!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sschools!5e0!3m2!1sen!2sus!4v1674759087644!5m2!1sen!2sus",
      shops:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d14861.798356615232!2d-157.75641393956465!3d21.372195172475713!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sshop%20%26%20eat!5e0!3m2!1sen!2sus!4v1674759152224!5m2!1sen!2sus",
    },
    highlights: [
      { label: "Parking", value: "4 Car Garage" },
      { label: "Outdoor", value: "Front + Back Porch" },
      { label: "AC", value: "Yes" },
      { label: "HOA", value: "None" },
      { label: "Listed", value: "February 5th, 2023" },
      { label: "Price/sqft", value: "$150" },
    ],
    interior: [
      { label: "Basement", value: "Yes" },
      { label: "Rooms", value: "21" },
      { label: "Bathrooms (full)", value: "2" },
      { label: "Dimensions & Layout", value: "3,502 sqft" },
    ],
    roomTypes: ["Interior"],
    imagePath: "JDesigns",
    team: "keystone",
  },
  {
    name: "M&M Architecture",
    address: {
      line1: "9300 Page Rd",
      city: "Wattsburg",
      state: "PA",
      postalCode: "16442",
    },
    totalCost: 550000,
    beds: 3,
    baths: 2.5,
    sqft: 3671,
    description:
      "This home is two stories with a half finished basement. This home has 3 bedrooms and 2 1/2 bathrooms along with a finished office. The home is a total of 3,671 sqft. The home was finished with a lot of exposed wood from the barn before.",
    year: 2022,
    propertyTax: 8898,
    assessment: 348650,
    maps: {
      location:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2961.690495264083!2d-79.83701178394756!3d42.071253061282476!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88329dd835c1e221%3A0x8d121628a6fac4b!2s9300%20Page%20Rd%2C%20Wattsburg%2C%20PA%2016442!5e0!3m2!1sen!2sus!4v1674759206639!5m2!1sen!2sus",
      schools:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d47387.00137514155!2d-79.86984237637296!3d42.07131541328841!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sshools!5e0!3m2!1sen!2sus!4v1674759238863!5m2!1sen!2sus",
      shops:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d189547.32440661825!2d-79.9749044452059!3d42.07154349218491!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sshop%20%26%20eat!5e0!3m2!1sen!2sus!4v1674759279473!5m2!1sen!2sus",
    },
    highlights: [
      { label: "Parking", value: "Garage" },
      { label: "Outdoor", value: "Deck, Creek" },
      { label: "AC", value: "Heating, Cooling" },
      { label: "HOA", value: "None" },
      { label: "Price/sqft", value: "$150" },
      { label: "Listed", value: "17 days ago" },
    ],
    interior: [{ label: "Bathrooms (full)", value: "2" }],
    roomTypes: [],
    imagePath: "M & M Architecture",
    team: "blueridge",
  },
  {
    name: "P & E Architects",
    address: {
      line1: "14687 County Rd 240",
      city: "Durango",
      state: "CO",
      postalCode: "81301",
    },
    totalCost: 702000,
    beds: 3,
    baths: 3,
    sqft: 4680,
    description:
      "This 3 bedroom home, designed by P&E Architecture, is located on a quiet street in Colorado, yet has quick access to shopping, hospitals, and entertainment. The huge, unfinished basement is big and can be finished to suit the new owner. A new roof was installed in 2022, as well as a new deck added in 2022, newly constructed.",
    year: 2022,
    propertyTax: 11357,
    assessment: 445000,
    maps: {
      location:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3171.3259795303097!2d-107.66982768402346!3d37.3584629437734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x873e9f7d9b56f06b%3A0x214dfeea9f362396!2s14687%20Co%20Rd%20240%2C%20Durango%2C%20CO%2081301!5e0!3m2!1sen!2sus!4v1674759317793!5m2!1sen!2sus",
      schools:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d405351.8509054634!2d-108.04519241393876!3d37.465176218985306!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sschools!5e0!3m2!1sen!2sus!4v1674759351005!5m2!1sen!2sus",
      shops:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d405349.52694006613!2d-108.04519314717058!3d37.465604850567935!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sshop%20%26%20eat!5e0!3m2!1sen!2sus!4v1674759378729!5m2!1sen!2sus",
    },
    highlights: [
      { label: "Parking", value: "Garage" },
      { label: "Outdoor", value: "Wrap Around Decks" },
      { label: "AC", value: "Heat and AC" },
      { label: "HOA", value: "None" },
      { label: "Price/sqft", value: "$150" },
      { label: "Listed", value: "10 days ago" },
    ],
    interior: [
      { label: "Basement", value: "Full Basement" },
      { label: "First Floor", value: "5 Rooms" },
      { label: "Second Floor", value: "5 Rooms, Balcony" },
      { label: "Bathrooms (full)", value: "3" },
      { label: "Dimensions & Layout", value: "4,680 sqft" },
    ],
    roomTypes: [],
    imagePath: "P & E Architects",
    team: "blueridge",
  },
  {
    name: "Supreme Renovations",
    address: {
      line1: "5715 N Washington Ave",
      city: "Emmett",
      state: "ID",
      postalCode: "83617",
    },
    totalCost: 647700,
    beds: 4,
    baths: 4,
    sqft: 4318,
    description:
      "This home was made from a monitor barn but was then renovated into a beautiful countryside home based in Idaho. This home has the original barn beams on the ceiling. It also has a 3 car garage and a spacious loft with the master bedroom and master bath in the loft. This 4,318 square foot barn home has plenty of space for activities inside and out, with 3 outdoor concrete slab porches on the front, back and right side of the house.",
    year: 2022,
    propertyTax: 10464,
    assessment: 409994,
    maps: {
      location:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2872.3177331312636!2d-116.4910576839146!3d43.95279184102309!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54af0b46342e6dcd%3A0x7619ee54ff8da272!2s5715%20N%20Washington%20Ave%2C%20Emmett%2C%20ID%2083617!5e0!3m2!1sen!2sus!4v1674759411495!5m2!1sen!2sus",
      schools:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d45957.037111587066!2d-116.5238882677273!3d43.95285212574872!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sschools!5e0!3m2!1sen!2sus!4v1674759438451!5m2!1sen!2sus",
      shops:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d183827.47396387422!2d-116.62895019626814!3d43.95307017693532!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sshop%20%26%20eat!5e0!3m2!1sen!2sus!4v1674759465932!5m2!1sen!2sus",
    },
    highlights: [
      { label: "Parking", value: "3 Car Garage" },
      { label: "Outdoor", value: "3 Concrete Slab Porches" },
      { label: "AC", value: "Heating & Cooling" },
      { label: "HOA", value: "None" },
      { label: "Price/sqft", value: "$150" },
      { label: "Listed", value: "1 day ago" },
    ],
    interior: [
      { label: "Basement", value: "Finished, 957 square footage" },
      { label: "Rooms", value: "3" },
      { label: "Bathrooms (full)", value: "2" },
    ],
    roomTypes: ["Bathroom", "Bedroom", "Recreation Room"],
    imagePath: "Supreme Renovations",
    team: "summit",
  },
];

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif)$/i;
const naturalCompare = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
}).compare;

const SEED_IMAGES_DIR = fileURLToPath(
  new URL("../../seed-images/", import.meta.url),
);

/** The stable URL-safe slug a house is stored and addressed by. */
export function houseSlug(name: string): string {
  return slugify(name);
}

/**
 * Photos for one house. Uses `seed-images/<image path>/` when present, copying
 * each file into the uploads folder under a stable name. When there is no
 * folder, `placeholders` decides whether to fall back to picsum.photos (the
 * demo seed) or to an empty gallery (the historical seed, which waits for real
 * photos).
 */
export function imagesFor(
  imagePath: string,
  slug: string,
  { placeholders = true }: { placeholders?: boolean } = {},
): string[] {
  const dir = join(SEED_IMAGES_DIR, imagePath);
  const files = existsSync(dir)
    ? readdirSync(dir)
        .filter((file) => IMAGE_EXTENSIONS.test(file))
        .sort(naturalCompare)
    : [];

  if (files.length === 0) {
    if (!placeholders) return [];
    return Array.from(
      { length: 5 },
      (_unused, index) =>
        `https://picsum.photos/seed/ects-${slug}-${index + 1}/1600/1000`,
    );
  }

  return files.map((file, index) => {
    const target = `${slug}-${String(index + 1).padStart(2, "0")}${extname(file).toLowerCase()}`;
    copyFileSync(join(dir, file), join(UPLOAD_DIR, target));
    return uploadUrl(target);
  });
}
