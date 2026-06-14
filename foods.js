// Built-in food database: name, typical serving, calories per serving.
// Add your own foods at the bottom — same format.
const FOOD_DB = [
  // Breakfast
  { name: "Egg (large, boiled/fried)", serving: "1 egg", kcal: 78 },
  { name: "Scrambled eggs", serving: "2 eggs", kcal: 180 },
  { name: "Omelette (cheese)", serving: "2-egg omelette", kcal: 290 },
  { name: "Bacon", serving: "2 strips", kcal: 90 },
  { name: "Sausage link", serving: "1 link", kcal: 100 },
  { name: "Pancake", serving: "1 medium (no syrup)", kcal: 90 },
  { name: "Maple syrup", serving: "2 tbsp", kcal: 100 },
  { name: "Waffle", serving: "1 round waffle", kcal: 220 },
  { name: "French toast", serving: "1 slice", kcal: 150 },
  { name: "Oatmeal (cooked)", serving: "1 cup", kcal: 160 },
  { name: "Cereal (corn flakes)", serving: "1 cup", kcal: 100 },
  { name: "Cereal (granola)", serving: "1/2 cup", kcal: 220 },
  { name: "Toast (white bread)", serving: "1 slice", kcal: 75 },
  { name: "Toast (whole wheat)", serving: "1 slice", kcal: 80 },
  { name: "Bagel (plain)", serving: "1 bagel", kcal: 280 },
  { name: "Croissant", serving: "1 medium", kcal: 230 },
  { name: "Muffin (blueberry)", serving: "1 medium", kcal: 380 },
  { name: "Donut (glazed)", serving: "1 donut", kcal: 260 },
  { name: "Yogurt (plain)", serving: "1 cup", kcal: 150 },
  { name: "Greek yogurt (plain, nonfat)", serving: "1 cup", kcal: 130 },
  { name: "Cottage cheese", serving: "1/2 cup", kcal: 110 },

  // Fruits
  { name: "Apple", serving: "1 medium", kcal: 95 },
  { name: "Banana", serving: "1 medium", kcal: 105 },
  { name: "Orange", serving: "1 medium", kcal: 62 },
  { name: "Grapes", serving: "1 cup", kcal: 62 },
  { name: "Strawberries", serving: "1 cup", kcal: 49 },
  { name: "Blueberries", serving: "1 cup", kcal: 84 },
  { name: "Watermelon", serving: "1 cup diced", kcal: 46 },
  { name: "Pineapple", serving: "1 cup chunks", kcal: 82 },
  { name: "Mango", serving: "1 cup sliced", kcal: 99 },
  { name: "Avocado", serving: "1/2 avocado", kcal: 120 },
  { name: "Peach", serving: "1 medium", kcal: 59 },
  { name: "Pear", serving: "1 medium", kcal: 101 },

  // Vegetables & sides
  { name: "Broccoli (cooked)", serving: "1 cup", kcal: 55 },
  { name: "Carrots (raw)", serving: "1 medium", kcal: 25 },
  { name: "Spinach (raw)", serving: "2 cups", kcal: 14 },
  { name: "Salad (garden, no dressing)", serving: "1 bowl", kcal: 35 },
  { name: "Caesar salad (with dressing)", serving: "1 bowl", kcal: 360 },
  { name: "Ranch dressing", serving: "2 tbsp", kcal: 130 },
  { name: "Corn (cooked)", serving: "1 ear", kcal: 90 },
  { name: "Green beans (cooked)", serving: "1 cup", kcal: 44 },
  { name: "Baked potato", serving: "1 medium", kcal: 160 },
  { name: "Mashed potatoes", serving: "1 cup", kcal: 240 },
  { name: "Sweet potato (baked)", serving: "1 medium", kcal: 100 },
  { name: "French fries", serving: "medium serving", kcal: 365 },
  { name: "Onion rings", serving: "8-9 rings", kcal: 280 },
  { name: "Coleslaw", serving: "1/2 cup", kcal: 150 },

  // Grains & pasta
  { name: "White rice (cooked)", serving: "1 cup", kcal: 205 },
  { name: "Brown rice (cooked)", serving: "1 cup", kcal: 215 },
  { name: "Fried rice", serving: "1 cup", kcal: 240 },
  { name: "Pasta with marinara", serving: "1.5 cups", kcal: 380 },
  { name: "Spaghetti with meatballs", serving: "1.5 cups", kcal: 550 },
  { name: "Mac and cheese", serving: "1 cup", kcal: 350 },
  { name: "Ramen (instant, prepared)", serving: "1 package", kcal: 380 },
  { name: "Quinoa (cooked)", serving: "1 cup", kcal: 222 },
  { name: "Tortilla (flour, 8\")", serving: "1 tortilla", kcal: 140 },
  { name: "Bread roll", serving: "1 roll", kcal: 110 },

  // Protein mains
  { name: "Chicken breast (grilled)", serving: "1 breast (6 oz)", kcal: 280 },
  { name: "Chicken thigh (roasted)", serving: "1 thigh", kcal: 210 },
  { name: "Fried chicken", serving: "1 breast piece", kcal: 360 },
  { name: "Chicken nuggets", serving: "6 nuggets", kcal: 280 },
  { name: "Chicken wings", serving: "6 wings", kcal: 430 },
  { name: "Steak (sirloin)", serving: "6 oz", kcal: 340 },
  { name: "Ground beef (cooked, 85%)", serving: "4 oz", kcal: 240 },
  { name: "Pork chop (grilled)", serving: "1 chop (6 oz)", kcal: 290 },
  { name: "Ham (sliced)", serving: "3 oz", kcal: 120 },
  { name: "Salmon (baked)", serving: "6 oz fillet", kcal: 350 },
  { name: "Tilapia (baked)", serving: "6 oz fillet", kcal: 220 },
  { name: "Tuna (canned in water)", serving: "1 can", kcal: 120 },
  { name: "Shrimp (cooked)", serving: "3 oz", kcal: 85 },
  { name: "Tofu (firm)", serving: "1/2 cup", kcal: 95 },
  { name: "Turkey breast (sliced)", serving: "3 oz", kcal: 90 },

  // Fast food & meals
  { name: "Hamburger", serving: "1 burger", kcal: 350 },
  { name: "Cheeseburger", serving: "1 burger", kcal: 450 },
  { name: "Double cheeseburger", serving: "1 burger", kcal: 650 },
  { name: "Hot dog (with bun)", serving: "1 hot dog", kcal: 290 },
  { name: "Pizza (cheese)", serving: "1 slice", kcal: 285 },
  { name: "Pizza (pepperoni)", serving: "1 slice", kcal: 310 },
  { name: "Taco (beef, hard shell)", serving: "1 taco", kcal: 210 },
  { name: "Burrito (chicken)", serving: "1 burrito", kcal: 650 },
  { name: "Burrito bowl (chicken)", serving: "1 bowl", kcal: 700 },
  { name: "Quesadilla (cheese)", serving: "1 quesadilla", kcal: 500 },
  { name: "Chicken sandwich (fried)", serving: "1 sandwich", kcal: 530 },
  { name: "Grilled cheese sandwich", serving: "1 sandwich", kcal: 400 },
  { name: "BLT sandwich", serving: "1 sandwich", kcal: 420 },
  { name: "Turkey sandwich", serving: "1 sandwich", kcal: 330 },
  { name: "PB&J sandwich", serving: "1 sandwich", kcal: 380 },
  { name: "Sub sandwich (6\", turkey)", serving: "6 inch sub", kcal: 280 },
  { name: "Sushi roll (California)", serving: "8 pieces", kcal: 300 },
  { name: "Chicken noodle soup", serving: "1 cup", kcal: 90 },
  { name: "Chili (with beans)", serving: "1 cup", kcal: 290 },
  { name: "Lasagna", serving: "1 piece", kcal: 380 },
  { name: "Chicken curry with rice", serving: "1 plate", kcal: 580 },
  { name: "Pad thai (chicken)", serving: "1 plate", kcal: 650 },
  { name: "General Tso's chicken with rice", serving: "1 plate", kcal: 800 },

  // Snacks
  { name: "Potato chips", serving: "1 oz (~15 chips)", kcal: 150 },
  { name: "Tortilla chips", serving: "1 oz (~10 chips)", kcal: 140 },
  { name: "Salsa", serving: "2 tbsp", kcal: 10 },
  { name: "Guacamole", serving: "2 tbsp", kcal: 50 },
  { name: "Popcorn (buttered)", serving: "2 cups", kcal: 110 },
  { name: "Pretzels", serving: "1 oz", kcal: 110 },
  { name: "Peanuts", serving: "1 oz (~28 nuts)", kcal: 160 },
  { name: "Almonds", serving: "1 oz (~23 nuts)", kcal: 165 },
  { name: "Cashews", serving: "1 oz", kcal: 160 },
  { name: "Peanut butter", serving: "2 tbsp", kcal: 190 },
  { name: "Trail mix", serving: "1/4 cup", kcal: 170 },
  { name: "Protein bar", serving: "1 bar", kcal: 200 },
  { name: "Granola bar", serving: "1 bar", kcal: 120 },
  { name: "Cheese (cheddar)", serving: "1 oz slice", kcal: 115 },
  { name: "String cheese", serving: "1 stick", kcal: 80 },
  { name: "Crackers (saltine)", serving: "5 crackers", kcal: 65 },
  { name: "Beef jerky", serving: "1 oz", kcal: 80 },
  { name: "Hummus", serving: "2 tbsp", kcal: 70 },

  // Sweets & desserts
  { name: "Chocolate chip cookie", serving: "1 medium", kcal: 80 },
  { name: "Brownie", serving: "1 square", kcal: 230 },
  { name: "Ice cream (vanilla)", serving: "1/2 cup", kcal: 140 },
  { name: "Ice cream (chocolate)", serving: "1/2 cup", kcal: 145 },
  { name: "Milkshake", serving: "16 oz", kcal: 580 },
  { name: "Chocolate bar (milk)", serving: "1.5 oz bar", kcal: 230 },
  { name: "Candy (gummy bears)", serving: "~17 pieces", kcal: 140 },
  { name: "Cake (chocolate, frosted)", serving: "1 slice", kcal: 350 },
  { name: "Cheesecake", serving: "1 slice", kcal: 400 },
  { name: "Apple pie", serving: "1 slice", kcal: 300 },
  { name: "Cupcake (frosted)", serving: "1 cupcake", kcal: 250 },

  // Drinks
  { name: "Coffee (black)", serving: "1 cup", kcal: 2 },
  { name: "Coffee with cream & sugar", serving: "1 cup", kcal: 60 },
  { name: "Latte (whole milk)", serving: "16 oz", kcal: 190 },
  { name: "Caramel frappuccino", serving: "16 oz", kcal: 380 },
  { name: "Tea (unsweetened)", serving: "1 cup", kcal: 2 },
  { name: "Sweet tea", serving: "16 oz", kcal: 180 },
  { name: "Orange juice", serving: "8 oz", kcal: 110 },
  { name: "Apple juice", serving: "8 oz", kcal: 115 },
  { name: "Milk (whole)", serving: "1 cup", kcal: 150 },
  { name: "Milk (2%)", serving: "1 cup", kcal: 120 },
  { name: "Milk (skim)", serving: "1 cup", kcal: 80 },
  { name: "Chocolate milk", serving: "1 cup", kcal: 210 },
  { name: "Soda (cola)", serving: "12 oz can", kcal: 140 },
  { name: "Diet soda", serving: "12 oz can", kcal: 0 },
  { name: "Energy drink", serving: "16 oz can", kcal: 210 },
  { name: "Sports drink", serving: "20 oz", kcal: 130 },
  { name: "Beer (regular)", serving: "12 oz", kcal: 150 },
  { name: "Beer (light)", serving: "12 oz", kcal: 100 },
  { name: "Wine (red)", serving: "5 oz glass", kcal: 125 },
  { name: "Smoothie (fruit)", serving: "16 oz", kcal: 280 },
  { name: "Protein shake", serving: "1 scoop + water", kcal: 130 },

  // Fast food chains (published values, approximate)
  { name: "McDonald's Big Mac", serving: "1 burger", kcal: 590 },
  { name: "McDonald's Quarter Pounder w/ Cheese", serving: "1 burger", kcal: 520 },
  { name: "McDonald's McChicken", serving: "1 sandwich", kcal: 400 },
  { name: "McDonald's fries", serving: "medium", kcal: 320 },
  { name: "McDonald's McNuggets", serving: "10 piece", kcal: 410 },
  { name: "Burger King Whopper", serving: "1 burger", kcal: 670 },
  { name: "Wendy's Dave's Single", serving: "1 burger", kcal: 590 },
  { name: "Wendy's Baconator", serving: "1 burger", kcal: 950 },
  { name: "Chick-fil-A Chicken Sandwich", serving: "1 sandwich", kcal: 440 },
  { name: "Chick-fil-A Nuggets", serving: "12 count", kcal: 380 },
  { name: "Chick-fil-A Waffle Fries", serving: "medium", kcal: 420 },
  { name: "Popeyes Chicken Sandwich", serving: "1 sandwich", kcal: 700 },
  { name: "Taco Bell Crunchwrap Supreme", serving: "1 crunchwrap", kcal: 530 },
  { name: "Taco Bell Doritos Locos Taco", serving: "1 taco", kcal: 170 },
  { name: "Taco Bell Bean Burrito", serving: "1 burrito", kcal: 350 },
  { name: "In-N-Out Double-Double", serving: "1 burger", kcal: 670 },
  { name: "In-N-Out fries", serving: "1 order", kcal: 370 },
  { name: "Five Guys Cheeseburger", serving: "1 burger", kcal: 840 },
  { name: "Five Guys fries", serving: "little", kcal: 530 },
  { name: "Raising Cane's chicken finger", serving: "1 finger", kcal: 130 },
  { name: "Raising Cane's crinkle fries", serving: "1 order", kcal: 390 },
  { name: "Raising Cane's Texas toast", serving: "1 slice", kcal: 150 },
  { name: "Raising Cane's sauce", serving: "1 cup", kcal: 190 },
  { name: "Panda Express Orange Chicken", serving: "1 serving", kcal: 490 },
  { name: "Panda Express Chow Mein", serving: "1 serving", kcal: 510 },
  { name: "Panda Express Fried Rice", serving: "1 serving", kcal: 520 },
  { name: "Domino's pepperoni pizza", serving: "1 slice (large)", kcal: 290 },
  { name: "KFC fried chicken breast", serving: "1 piece", kcal: 390 },
  { name: "Chipotle chips", serving: "1 bag", kcal: 540 },
];

// "Eating out" meal builder: pick a base, check what's in it, calories sum up.
// Values from the chains' published nutrition info (approximate).
const MEAL_BUILDER = {
  "Chipotle": {
    formats: [
      { name: "Bowl / Salad", kcal: 0, mult: 1 },
      { name: "Burrito (flour tortilla)", kcal: 320, mult: 1 },
      { name: "3 Tacos (shells)", kcal: 240, mult: 1 },
    ],
    groups: [
      { name: "Protein", items: [
        { name: "Chicken", kcal: 180 }, { name: "Steak", kcal: 150 },
        { name: "Barbacoa", kcal: 170 }, { name: "Carnitas", kcal: 210 },
        { name: "Sofritas", kcal: 150 }, { name: "Double protein (add again)", kcal: 180 },
      ]},
      { name: "Rice & Beans", items: [
        { name: "White rice", kcal: 210 }, { name: "Brown rice", kcal: 210 },
        { name: "Black beans", kcal: 130 }, { name: "Pinto beans", kcal: 130 },
      ]},
      { name: "Toppings", items: [
        { name: "Fajita veggies", kcal: 20 }, { name: "Fresh tomato salsa", kcal: 25 },
        { name: "Corn salsa", kcal: 80 }, { name: "Green chili salsa", kcal: 15 },
        { name: "Red chili salsa", kcal: 30 }, { name: "Cheese", kcal: 110 },
        { name: "Sour cream", kcal: 110 }, { name: "Guacamole", kcal: 230 },
        { name: "Queso blanco", kcal: 120 }, { name: "Lettuce", kcal: 5 },
      ]},
      { name: "Sides", items: [
        { name: "Chips", kcal: 540 }, { name: "Side of guac", kcal: 230 },
        { name: "Side of queso", kcal: 120 },
      ]},
    ],
  },
  "Subway": {
    formats: [
      { name: "6-inch", kcal: 0, mult: 1 },
      { name: "Footlong (doubles everything)", kcal: 0, mult: 2 },
    ],
    groups: [
      { name: "Bread", items: [
        { name: "Italian bread", kcal: 200 }, { name: "Wheat bread", kcal: 210 },
        { name: "Italian Herbs & Cheese", kcal: 240 }, { name: "Wrap", kcal: 290 },
        { name: "No bread (salad)", kcal: 0 },
      ]},
      { name: "Protein", items: [
        { name: "Turkey", kcal: 50 }, { name: "Ham", kcal: 60 },
        { name: "Roast beef", kcal: 80 }, { name: "Rotisserie chicken", kcal: 80 },
        { name: "Steak", kcal: 110 }, { name: "Tuna", kcal: 250 },
        { name: "Meatballs in marinara", kcal: 240 },
      ]},
      { name: "Cheese", items: [
        { name: "American cheese", kcal: 40 }, { name: "Provolone", kcal: 50 },
        { name: "Pepper jack", kcal: 50 },
      ]},
      { name: "Veggies", items: [
        { name: "Lettuce", kcal: 5 }, { name: "Tomatoes", kcal: 10 },
        { name: "Onions", kcal: 10 }, { name: "Green peppers", kcal: 5 },
        { name: "Cucumbers", kcal: 5 }, { name: "Pickles", kcal: 0 },
        { name: "Olives", kcal: 15 }, { name: "Spinach", kcal: 5 },
        { name: "Jalapeños", kcal: 5 }, { name: "Avocado", kcal: 60 },
      ]},
      { name: "Sauce", items: [
        { name: "Mayo", kcal: 100 }, { name: "Light mayo", kcal: 50 },
        { name: "Ranch", kcal: 110 }, { name: "Chipotle Southwest", kcal: 100 },
        { name: "Sweet onion", kcal: 40 }, { name: "Honey mustard", kcal: 30 },
        { name: "Yellow mustard", kcal: 10 }, { name: "Oil & vinegar", kcal: 45 },
      ]},
    ],
  },
  "McDonald's": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Burgers & Sandwiches", items: [
        { name: "Big Mac", kcal: 590 }, { name: "Quarter Pounder w/ Cheese", kcal: 520 },
        { name: "McDouble", kcal: 400 }, { name: "Cheeseburger", kcal: 300 },
        { name: "McChicken", kcal: 400 }, { name: "Filet-O-Fish", kcal: 390 },
        { name: "McCrispy", kcal: 470 }, { name: "6pc McNuggets", kcal: 250 },
        { name: "10pc McNuggets", kcal: 410 },
      ]},
      { name: "Sides", items: [
        { name: "Fries (small)", kcal: 230 }, { name: "Fries (medium)", kcal: 320 },
        { name: "Fries (large)", kcal: 480 }, { name: "Apple slices", kcal: 15 },
      ]},
      { name: "Drinks & Desserts", items: [
        { name: "Coke (medium)", kcal: 200 }, { name: "Sprite (medium)", kcal: 200 },
        { name: "Sweet tea (medium)", kcal: 100 }, { name: "McFlurry Oreo", kcal: 510 },
        { name: "Chocolate shake (medium)", kcal: 620 }, { name: "Apple pie", kcal: 230 },
      ]},
      { name: "Breakfast", items: [
        { name: "Egg McMuffin", kcal: 310 }, { name: "Sausage McMuffin w/ Egg", kcal: 480 },
        { name: "Hash browns", kcal: 140 }, { name: "Hotcakes", kcal: 580 },
        { name: "Sausage burrito", kcal: 300 },
      ]},
    ],
  },
  "Taco Bell": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Tacos & Burritos", items: [
        { name: "Crunchy taco", kcal: 170 }, { name: "Soft taco", kcal: 180 },
        { name: "Doritos Locos taco", kcal: 170 }, { name: "Bean burrito", kcal: 350 },
        { name: "Burrito Supreme", kcal: 390 }, { name: "5-Layer burrito", kcal: 490 },
        { name: "Crunchwrap Supreme", kcal: 530 }, { name: "Chicken quesadilla", kcal: 510 },
        { name: "Mexican Pizza", kcal: 540 },
      ]},
      { name: "Sides & Extras", items: [
        { name: "Nachos BellGrande", kcal: 740 }, { name: "Chips & nacho cheese", kcal: 320 },
        { name: "Cinnamon twists", kcal: 170 }, { name: "Black beans & rice", kcal: 170 },
        { name: "Sour cream (add)", kcal: 30 }, { name: "Guacamole (add)", kcal: 35 },
      ]},
      { name: "Drinks", items: [
        { name: "Baja Blast (medium)", kcal: 220 }, { name: "Regular soda (medium)", kcal: 200 },
      ]},
    ],
  },
  "Wendy's": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Burgers & Sandwiches", items: [
        { name: "Dave's Single", kcal: 590 }, { name: "Dave's Double", kcal: 810 },
        { name: "Baconator", kcal: 950 }, { name: "Jr. Cheeseburger", kcal: 290 },
        { name: "Spicy Chicken Sandwich", kcal: 490 }, { name: "10pc Nuggets", kcal: 450 },
      ]},
      { name: "Sides", items: [
        { name: "Fries (medium)", kcal: 350 }, { name: "Chili (small)", kcal: 240 },
        { name: "Baked potato", kcal: 270 },
      ]},
      { name: "Drinks & Desserts", items: [
        { name: "Frosty (medium)", kcal: 510 }, { name: "Lemonade (medium)", kcal: 190 },
        { name: "Soda (medium)", kcal: 200 },
      ]},
    ],
  },
  "Chick-fil-A": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Entrees", items: [
        { name: "Chicken Sandwich", kcal: 440 }, { name: "Deluxe Sandwich", kcal: 500 },
        { name: "Spicy Chicken Sandwich", kcal: 450 }, { name: "8pc Nuggets", kcal: 250 },
        { name: "12pc Nuggets", kcal: 380 }, { name: "Grilled Sandwich", kcal: 390 },
        { name: "Cool Wrap", kcal: 660 },
      ]},
      { name: "Sides", items: [
        { name: "Waffle fries (medium)", kcal: 420 }, { name: "Mac & cheese (medium)", kcal: 450 },
        { name: "Fruit cup", kcal: 60 }, { name: "Side salad", kcal: 160 },
      ]},
      { name: "Drinks & Sauces", items: [
        { name: "Lemonade (medium)", kcal: 220 }, { name: "Sweet tea (medium)", kcal: 120 },
        { name: "Milkshake", kcal: 580 }, { name: "Chick-fil-A sauce", kcal: 140 },
        { name: "Polynesian sauce", kcal: 110 },
      ]},
    ],
  },
  "Panda Express": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Entrees", items: [
        { name: "Orange Chicken", kcal: 490 }, { name: "Beijing Beef", kcal: 480 },
        { name: "Broccoli Beef", kcal: 150 }, { name: "Kung Pao Chicken", kcal: 290 },
        { name: "Grilled Teriyaki Chicken", kcal: 340 }, { name: "Honey Walnut Shrimp", kcal: 430 },
        { name: "Mushroom Chicken", kcal: 220 },
      ]},
      { name: "Sides", items: [
        { name: "Chow Mein", kcal: 510 }, { name: "Fried Rice", kcal: 520 },
        { name: "White Rice", kcal: 380 }, { name: "Super Greens", kcal: 90 },
      ]},
      { name: "Extras", items: [
        { name: "Cream Cheese Rangoons (3)", kcal: 190 }, { name: "Chicken Egg Roll", kcal: 200 },
        { name: "Veggie Spring Roll (2)", kcal: 240 }, { name: "Fortune cookie", kcal: 30 },
      ]},
    ],
  },
  "Five Guys": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Burgers & Dogs", items: [
        { name: "Little Hamburger", kcal: 540 }, { name: "Little Cheeseburger", kcal: 630 },
        { name: "Hamburger (2 patties)", kcal: 700 }, { name: "Cheeseburger (2 patties)", kcal: 840 },
        { name: "Bacon Cheeseburger", kcal: 920 }, { name: "Hot Dog", kcal: 540 },
      ]},
      { name: "Toppings", items: [
        { name: "Mayo", kcal: 100 }, { name: "Ketchup", kcal: 15 },
        { name: "Mustard", kcal: 0 }, { name: "Grilled onions", kcal: 10 },
        { name: "Grilled mushrooms", kcal: 10 }, { name: "Lettuce/tomato/pickles", kcal: 15 },
        { name: "BBQ sauce", kcal: 50 }, { name: "A.1. sauce", kcal: 15 },
      ]},
      { name: "Fries & Shakes", items: [
        { name: "Fries (little)", kcal: 530 }, { name: "Fries (regular)", kcal: 950 },
        { name: "Milkshake", kcal: 670 },
      ]},
    ],
  },
  "Wingstop": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Wings", items: [
        { name: "6 classic wings", kcal: 430 }, { name: "8 classic wings", kcal: 570 },
        { name: "10 classic wings", kcal: 710 }, { name: "6 boneless wings", kcal: 570 },
        { name: "8 boneless wings", kcal: 760 }, { name: "3 crispy tenders", kcal: 530 },
      ]},
      { name: "Sides & Dips", items: [
        { name: "Seasoned fries (regular)", kcal: 430 }, { name: "Cheese fries", kcal: 670 },
        { name: "Ranch dip", kcal: 310 }, { name: "Blue cheese dip", kcal: 320 },
        { name: "Honey mustard", kcal: 190 }, { name: "Rolls (1)", kcal: 160 },
      ]},
    ],
  },
  "Starbucks": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Drinks (grande)", items: [
        { name: "Caffè latte", kcal: 190 }, { name: "Caramel macchiato", kcal: 250 },
        { name: "Caramel frappuccino", kcal: 380 }, { name: "Cold brew (black)", kcal: 5 },
        { name: "Pink Drink", kcal: 140 }, { name: "Chai tea latte", kcal: 240 },
        { name: "Hot chocolate", kcal: 370 }, { name: "Refresher", kcal: 90 },
      ]},
      { name: "Food", items: [
        { name: "Butter croissant", kcal: 260 }, { name: "Banana bread", kcal: 420 },
        { name: "Bacon & gouda sandwich", kcal: 360 }, { name: "Egg white bites", kcal: 170 },
        { name: "Cake pop", kcal: 140 }, { name: "Blueberry muffin", kcal: 360 },
      ]},
    ],
  },
  "Pizza place": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Pizza (large slice)", items: [
        { name: "Cheese slice", kcal: 285 }, { name: "Pepperoni slice", kcal: 310 },
        { name: "Supreme slice", kcal: 330 }, { name: "Meat lover's slice", kcal: 380 },
        { name: "Veggie slice", kcal: 260 }, { name: "Extra slice (add another)", kcal: 300 },
      ]},
      { name: "Sides", items: [
        { name: "Garlic knots (2)", kcal: 180 }, { name: "Breadsticks (1)", kcal: 140 },
        { name: "6 wings", kcal: 540 }, { name: "Ranch dip", kcal: 130 },
        { name: "Caesar side salad", kcal: 220 },
      ]},
    ],
  },
  "Burger King": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Burgers & Sandwiches", items: [
        { name: "Whopper", kcal: 670 }, { name: "Double Whopper", kcal: 900 },
        { name: "Bacon King", kcal: 1150 }, { name: "Cheeseburger", kcal: 300 },
        { name: "Original Chicken Sandwich", kcal: 660 }, { name: "Ch'King", kcal: 800 },
        { name: "8pc Nuggets", kcal: 340 },
      ]},
      { name: "Sides", items: [
        { name: "Fries (medium)", kcal: 380 }, { name: "Onion rings (medium)", kcal: 410 },
        { name: "Mozzarella sticks (4)", kcal: 280 },
      ]},
      { name: "Drinks & Desserts", items: [
        { name: "Soda (medium)", kcal: 220 }, { name: "Chocolate shake", kcal: 690 },
        { name: "Hershey's pie", kcal: 320 },
      ]},
    ],
  },
  "Popeyes": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Chicken", items: [
        { name: "Chicken Sandwich", kcal: 700 }, { name: "Spicy Chicken Sandwich", kcal: 700 },
        { name: "Chicken breast (mild)", kcal: 380 }, { name: "Chicken thigh", kcal: 280 },
        { name: "3pc tenders", kcal: 340 }, { name: "6pc nuggets", kcal: 300 },
      ]},
      { name: "Sides", items: [
        { name: "Cajun fries (regular)", kcal: 340 }, { name: "Red beans & rice", kcal: 230 },
        { name: "Mac & cheese", kcal: 230 }, { name: "Biscuit", kcal: 200 },
        { name: "Coleslaw", kcal: 200 },
      ]},
    ],
  },
  "KFC": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Chicken", items: [
        { name: "Original Recipe breast", kcal: 390 }, { name: "Original Recipe thigh", kcal: 280 },
        { name: "Original Recipe drumstick", kcal: 130 }, { name: "Extra Crispy breast", kcal: 530 },
        { name: "Chicken Sandwich", kcal: 650 }, { name: "8pc nuggets", kcal: 340 },
        { name: "Famous Bowl", kcal: 710 },
      ]},
      { name: "Sides", items: [
        { name: "Mashed potatoes & gravy", kcal: 130 }, { name: "Mac & cheese", kcal: 170 },
        { name: "Cole slaw", kcal: 170 }, { name: "Biscuit", kcal: 180 },
        { name: "Fries (individual)", kcal: 320 },
      ]},
    ],
  },
  "Arby's": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Sandwiches", items: [
        { name: "Classic Roast Beef", kcal: 360 }, { name: "Beef 'n Cheddar", kcal: 450 },
        { name: "Half Pound Roast Beef", kcal: 610 }, { name: "Crispy Chicken Sandwich", kcal: 530 },
        { name: "Reuben", kcal: 660 }, { name: "Gyro", kcal: 710 },
      ]},
      { name: "Sides", items: [
        { name: "Curly fries (medium)", kcal: 410 }, { name: "Mozzarella sticks (4)", kcal: 510 },
        { name: "Jalapeño Bites (5)", kcal: 310 }, { name: "Loaded curly fries", kcal: 560 },
      ]},
      { name: "Shakes", items: [
        { name: "Chocolate shake", kcal: 590 }, { name: "Jamocha shake", kcal: 580 },
      ]},
    ],
  },
  "Sonic": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Burgers & Dogs", items: [
        { name: "SuperSONIC Double", kcal: 800 }, { name: "Quarter Pound Double", kcal: 670 },
        { name: "All-American Hot Dog", kcal: 410 }, { name: "Chili Cheese Coney", kcal: 460 },
        { name: "Crispy Tenders (3)", kcal: 330 },
      ]},
      { name: "Sides", items: [
        { name: "Tots (medium)", kcal: 330 }, { name: "Fries (medium)", kcal: 330 },
        { name: "Mozzarella sticks (5)", kcal: 440 }, { name: "Onion rings (medium)", kcal: 440 },
      ]},
      { name: "Drinks & Treats", items: [
        { name: "Cherry limeade (medium)", kcal: 200 }, { name: "Oreo Blast (medium)", kcal: 690 },
        { name: "Slush (medium)", kcal: 320 },
      ]},
    ],
  },
  "Jack in the Box": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Burgers & Sandwiches", items: [
        { name: "Jumbo Jack", kcal: 600 }, { name: "Sourdough Jack", kcal: 710 },
        { name: "Buttery Jack", kcal: 840 }, { name: "Spicy Chicken Sandwich", kcal: 530 },
        { name: "Chicken nuggets (5)", kcal: 250 },
      ]},
      { name: "Tacos & Sides", items: [
        { name: "2 Tacos", kcal: 340 }, { name: "Curly fries (medium)", kcal: 360 },
        { name: "Onion rings", kcal: 500 }, { name: "Stuffed jalapeños (3)", kcal: 230 },
      ]},
      { name: "Drinks & Shakes", items: [
        { name: "Oreo shake", kcal: 740 }, { name: "Soda (medium)", kcal: 200 },
      ]},
    ],
  },
  "Whataburger": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Burgers & Sandwiches", items: [
        { name: "Whataburger", kcal: 590 }, { name: "Double Meat Whataburger", kcal: 800 },
        { name: "Whataburger Jr.", kcal: 310 }, { name: "Whatachick'n Sandwich", kcal: 600 },
        { name: "Chicken strips (3)", kcal: 470 },
      ]},
      { name: "Sides", items: [
        { name: "Fries (medium)", kcal: 420 }, { name: "Onion rings (medium)", kcal: 420 },
      ]},
      { name: "Shakes", items: [
        { name: "Chocolate shake (medium)", kcal: 670 }, { name: "Soda (medium)", kcal: 230 },
      ]},
    ],
  },
  "Shake Shack": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Burgers & Sandwiches", items: [
        { name: "ShackBurger (single)", kcal: 530 }, { name: "ShackBurger (double)", kcal: 770 },
        { name: "SmokeShack (single)", kcal: 580 }, { name: "Hamburger (single)", kcal: 430 },
        { name: "Chicken Shack", kcal: 550 }, { name: "Hot dog", kcal: 380 },
      ]},
      { name: "Fries & Shakes", items: [
        { name: "Fries", kcal: 470 }, { name: "Cheese fries", kcal: 590 },
        { name: "Chocolate shake", kcal: 800 }, { name: "Vanilla shake", kcal: 750 },
      ]},
    ],
  },
  "Dairy Queen": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Food", items: [
        { name: "1/4 lb GrillBurger", kcal: 600 }, { name: "Chicken strips (4)", kcal: 640 },
        { name: "Chicken sandwich", kcal: 530 }, { name: "Fries (medium)", kcal: 380 },
      ]},
      { name: "Blizzards & Treats", items: [
        { name: "Oreo Blizzard (medium)", kcal: 690 }, { name: "M&M Blizzard (medium)", kcal: 840 },
        { name: "Choc dipped cone (medium)", kcal: 470 }, { name: "Banana split", kcal: 510 },
        { name: "Dilly Bar", kcal: 240 },
      ]},
    ],
  },
  "Culver's": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "ButterBurgers & More", items: [
        { name: "ButterBurger (single)", kcal: 380 }, { name: "ButterBurger Deluxe (double)", kcal: 690 },
        { name: "Bacon Deluxe (double)", kcal: 790 }, { name: "Chicken Sandwich (crispy)", kcal: 710 },
        { name: "Chicken tenders (3)", kcal: 380 },
      ]},
      { name: "Sides", items: [
        { name: "Crinkle fries (medium)", kcal: 410 }, { name: "Cheese curds (regular)", kcal: 660 },
        { name: "Onion rings", kcal: 540 },
      ]},
      { name: "Custard", items: [
        { name: "Concrete Mixer (regular)", kcal: 800 }, { name: "Vanilla cone (single)", kcal: 320 },
        { name: "Sundae", kcal: 500 },
      ]},
    ],
  },
  "Raising Cane's": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Chicken Fingers", items: [
        { name: "Chicken finger", kcal: 130 }, { name: "Box Combo (4 fingers)", kcal: 520 },
        { name: "3 Finger Combo", kcal: 390 },
      ]},
      { name: "Sides & Extras", items: [
        { name: "Crinkle fries", kcal: 390 }, { name: "Texas toast", kcal: 150 },
        { name: "Coleslaw", kcal: 120 }, { name: "Cane's sauce", kcal: 190 },
      ]},
      { name: "Drinks", items: [
        { name: "Sweet tea (regular)", kcal: 160 }, { name: "Lemonade (regular)", kcal: 190 },
      ]},
    ],
  },
  "Jersey Mike's": {
    formats: [
      { name: "Mini", kcal: 0, mult: 0.6 },
      { name: "Regular (7\")", kcal: 0, mult: 1 },
      { name: "Giant (15\")", kcal: 0, mult: 2.1 },
    ],
    groups: [
      { name: "Bread & Base", items: [
        { name: "White bread", kcal: 300 }, { name: "Wheat bread", kcal: 320 },
        { name: "Rosemary Parm bread", kcal: 360 }, { name: "Tub (no bread)", kcal: 40 },
      ]},
      { name: "Sub", items: [
        { name: "#7 Turkey & Provolone", kcal: 230 }, { name: "#9 Club Supreme", kcal: 360 },
        { name: "#13 Original Italian", kcal: 380 }, { name: "Philly Cheese Steak", kcal: 400 },
        { name: "#43 Chipotle Cheese Steak", kcal: 460 }, { name: "Tuna", kcal: 430 },
      ]},
      { name: "Toppings", items: [
        { name: "Lettuce/tomato/onion", kcal: 15 }, { name: "Extra cheese", kcal: 80 },
        { name: "Mayo", kcal: 100 }, { name: "Oil & vinegar + spices", kcal: 120 },
      ]},
    ],
  },
  "Jimmy John's": {
    formats: [{ name: "8\" sub", kcal: 0, mult: 1 }],
    groups: [
      { name: "Sandwich", items: [
        { name: "#1 Pepe (ham)", kcal: 600 }, { name: "#4 Turkey Tom", kcal: 510 },
        { name: "#9 Italian Night Club", kcal: 740 }, { name: "Beach Club", kcal: 740 },
        { name: "Vito", kcal: 660 }, { name: "Unwich (lettuce wrap, any)", kcal: 250 },
      ]},
      { name: "Sides", items: [
        { name: "Chips", kcal: 230 }, { name: "Jumbo pickle", kcal: 15 },
        { name: "Chocolate chip cookie", kcal: 420 },
      ]},
    ],
  },
  "Panera Bread": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Sandwiches & Salads", items: [
        { name: "Bacon Turkey Bravo", kcal: 770 }, { name: "Chipotle Chicken Avocado", kcal: 920 },
        { name: "Mediterranean Veggie", kcal: 530 }, { name: "Caesar Salad w/ chicken", kcal: 470 },
        { name: "Greek Salad", kcal: 380 },
      ]},
      { name: "Soups & Mac", items: [
        { name: "Broccoli Cheddar soup (cup)", kcal: 230 }, { name: "Mac & Cheese (small)", kcal: 480 },
        { name: "Creamy Tomato soup (cup)", kcal: 230 }, { name: "Bread bowl (add)", kcal: 540 },
      ]},
      { name: "Bakery & Drinks", items: [
        { name: "Bagel (plain)", kcal: 280 }, { name: "Chocolate chip cookie", kcal: 400 },
        { name: "Cinnamon roll", kcal: 620 }, { name: "Iced coffee", kcal: 5 },
      ]},
    ],
  },
  "Dunkin'": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Drinks (medium)", items: [
        { name: "Iced coffee (black)", kcal: 10 }, { name: "Latte", kcal: 190 },
        { name: "Caramel Iced Macchiato", kcal: 230 }, { name: "Frozen Coffee", kcal: 590 },
        { name: "Coolatta", kcal: 350 }, { name: "Hot chocolate", kcal: 320 },
      ]},
      { name: "Food", items: [
        { name: "Glazed donut", kcal: 240 }, { name: "Boston Kreme donut", kcal: 300 },
        { name: "Bacon Egg & Cheese (croissant)", kcal: 540 }, { name: "Sausage Egg & Cheese", kcal: 600 },
        { name: "Hash browns", kcal: 140 }, { name: "Bagel w/ cream cheese", kcal: 460 },
        { name: "Munchkins (5)", kcal: 290 },
      ]},
    ],
  },
  "Domino's": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Pizza (large slice)", items: [
        { name: "Cheese slice", kcal: 290 }, { name: "Pepperoni slice", kcal: 320 },
        { name: "ExtravaganZZa slice", kcal: 380 }, { name: "Philly Cheese Steak slice", kcal: 320 },
        { name: "Add a slice", kcal: 300 },
      ]},
      { name: "Sides", items: [
        { name: "Stuffed Cheesy Bread (1pc)", kcal: 140 }, { name: "Boneless wings (4)", kcal: 250 },
        { name: "Garlic bread twists (1)", kcal: 130 }, { name: "Lava Cake (1)", kcal: 350 },
        { name: "Ranch dip", kcal: 190 },
      ]},
    ],
  },
  "Pizza Hut": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Pizza (large slice)", items: [
        { name: "Cheese slice", kcal: 300 }, { name: "Pepperoni slice", kcal: 320 },
        { name: "Meat Lover's slice", kcal: 400 }, { name: "Supreme slice", kcal: 340 },
        { name: "Pan slice (add)", kcal: 330 },
      ]},
      { name: "Sides", items: [
        { name: "Breadsticks (1)", kcal: 140 }, { name: "Cheese sticks (1)", kcal: 140 },
        { name: "Traditional wings (2)", kcal: 160 }, { name: "Cinnamon sticks (2)", kcal: 170 },
      ]},
    ],
  },
  "Little Caesars": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Pizza (slice)", items: [
        { name: "Cheese slice", kcal: 240 }, { name: "Pepperoni slice", kcal: 280 },
        { name: "Deep Dish pepperoni slice", kcal: 360 }, { name: "Add a slice", kcal: 270 },
      ]},
      { name: "Sides", items: [
        { name: "Crazy Bread (1 stick)", kcal: 100 }, { name: "Italian Cheese Bread (1)", kcal: 130 },
        { name: "Caesar Wings (2)", kcal: 140 }, { name: "Crazy sauce", kcal: 45 },
      ]},
    ],
  },
  "Qdoba": {
    formats: [
      { name: "Bowl", kcal: 0, mult: 1 },
      { name: "Burrito (tortilla)", kcal: 300, mult: 1 },
      { name: "3 Tacos", kcal: 270, mult: 1 },
    ],
    groups: [
      { name: "Protein", items: [
        { name: "Grilled Chicken", kcal: 160 }, { name: "Steak", kcal: 180 },
        { name: "Pork", kcal: 170 }, { name: "Impossible", kcal: 230 },
      ]},
      { name: "Rice & Beans", items: [
        { name: "Cilantro lime rice", kcal: 190 }, { name: "Brown rice", kcal: 190 },
        { name: "Black beans", kcal: 130 }, { name: "Pinto beans", kcal: 130 },
      ]},
      { name: "Toppings", items: [
        { name: "Cheese", kcal: 100 }, { name: "Sour cream", kcal: 60 },
        { name: "Guacamole", kcal: 200 }, { name: "Queso (3-cheese)", kcal: 120 },
        { name: "Pico de gallo", kcal: 15 }, { name: "Corn salsa", kcal: 80 },
        { name: "Fajita veggies", kcal: 30 },
      ]},
    ],
  },
  "Del Taco": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Tacos & Burritos", items: [
        { name: "Del Taco (crunchy)", kcal: 160 }, { name: "Grilled Chicken Taco", kcal: 160 },
        { name: "Epic Cali Burrito", kcal: 980 }, { name: "Bean & Cheese Burrito", kcal: 380 },
        { name: "Crispy Chicken Taco", kcal: 270 },
      ]},
      { name: "Sides", items: [
        { name: "Crinkle fries (medium)", kcal: 330 }, { name: "Queso Loaded Fries", kcal: 670 },
        { name: "Nachos", kcal: 380 },
      ]},
    ],
  },
  "In-N-Out": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Burgers", items: [
        { name: "Hamburger", kcal: 390 }, { name: "Cheeseburger", kcal: 480 },
        { name: "Double-Double", kcal: 670 }, { name: "Protein style (any, lettuce wrap)", kcal: 240 },
        { name: "Animal style (add)", kcal: 80 },
      ]},
      { name: "Sides & Shakes", items: [
        { name: "Fries", kcal: 370 }, { name: "Animal style fries", kcal: 750 },
        { name: "Chocolate shake", kcal: 590 }, { name: "Vanilla shake", kcal: 580 },
      ]},
    ],
  },
  "Chili's": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Mains", items: [
        { name: "Oldtimer Burger", kcal: 850 }, { name: "Chicken Crispers (3)", kcal: 660 },
        { name: "Baby Back Ribs (half)", kcal: 610 }, { name: "Cajun Chicken Pasta", kcal: 1110 },
        { name: "6oz Sirloin", kcal: 270 }, { name: "Fajitas (chicken)", kcal: 540 },
      ]},
      { name: "Apps & Sides", items: [
        { name: "Southwest Eggrolls (3)", kcal: 590 }, { name: "Fried pickles", kcal: 460 },
        { name: "Loaded fries", kcal: 1290 }, { name: "Chips & salsa", kcal: 470 },
        { name: "Side salad", kcal: 150 },
      ]},
      { name: "Desserts", items: [
        { name: "Molten Chocolate Cake", kcal: 1160 }, { name: "Skillet cookie", kcal: 1010 },
      ]},
    ],
  },
  "Applebee's": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Mains", items: [
        { name: "Classic Cheeseburger", kcal: 1000 }, { name: "Fiesta Lime Chicken", kcal: 1080 },
        { name: "Bourbon St. Chicken & Shrimp", kcal: 950 }, { name: "Riblets platter", kcal: 800 },
        { name: "Oriental Chicken Salad", kcal: 1320 }, { name: "6oz Top Sirloin", kcal: 330 },
      ]},
      { name: "Apps & Sides", items: [
        { name: "Mozzarella sticks (4)", kcal: 510 }, { name: "Boneless wings (starter)", kcal: 740 },
        { name: "Spinach & artichoke dip", kcal: 900 }, { name: "Fries", kcal: 380 },
      ]},
    ],
  },
  "Buffalo Wild Wings": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Wings & Tenders", items: [
        { name: "Traditional wings (6)", kcal: 430 }, { name: "Traditional wings (10)", kcal: 720 },
        { name: "Boneless wings (6)", kcal: 540 }, { name: "Boneless wings (10)", kcal: 900 },
        { name: "Hand-breaded tenders (4)", kcal: 670 },
      ]},
      { name: "Sauce (per order)", items: [
        { name: "Buffalo (medium)", kcal: 80 }, { name: "Honey BBQ", kcal: 150 },
        { name: "Parmesan Garlic", kcal: 290 }, { name: "Mango Habanero", kcal: 150 },
        { name: "Asian Zing", kcal: 120 },
      ]},
      { name: "Sides", items: [
        { name: "Fries (regular)", kcal: 420 }, { name: "Cheese curds", kcal: 750 },
        { name: "Mozzarella sticks", kcal: 640 }, { name: "Ranch dip", kcal: 220 },
      ]},
    ],
  },
  "Olive Garden": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Pasta & Mains", items: [
        { name: "Fettuccine Alfredo", kcal: 1010 }, { name: "Chicken Parmigiana", kcal: 1060 },
        { name: "Lasagna Classico", kcal: 930 }, { name: "Shrimp Scampi", kcal: 540 },
        { name: "Spaghetti & meatballs", kcal: 750 }, { name: "Chicken Alfredo", kcal: 1330 },
      ]},
      { name: "Starters & Sides", items: [
        { name: "Breadstick (1)", kcal: 140 }, { name: "Salad w/ dressing (1 serving)", kcal: 150 },
        { name: "Zuppa Toscana (bowl)", kcal: 320 }, { name: "Fried Mozzarella", kcal: 720 },
        { name: "Calamari", kcal: 890 },
      ]},
    ],
  },
  "Texas Roadhouse": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Steaks & Mains", items: [
        { name: "6oz Sirloin", kcal: 230 }, { name: "12oz Ribeye", kcal: 880 },
        { name: "Pulled Pork", kcal: 440 }, { name: "Grilled BBQ Chicken", kcal: 280 },
        { name: "Country Fried Sirloin", kcal: 1030 }, { name: "Fall-off-the-bone Ribs (full)", kcal: 1540 },
      ]},
      { name: "Sides & Bread", items: [
        { name: "Fresh baked roll + butter", kcal: 280 }, { name: "Loaded baked potato", kcal: 770 },
        { name: "Seasoned rice", kcal: 200 }, { name: "Steak fries", kcal: 420 },
        { name: "Green beans", kcal: 170 },
      ]},
    ],
  },
  "IHOP": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Breakfast", items: [
        { name: "Original buttermilk pancakes (2)", kcal: 350 }, { name: "Stack of pancakes (4)", kcal: 590 },
        { name: "Belgian waffle", kcal: 590 }, { name: "Breakfast Sampler", kcal: 1180 },
        { name: "2x2x2 combo", kcal: 690 }, { name: "French toast (2)", kcal: 470 },
      ]},
      { name: "Sides", items: [
        { name: "Hash browns", kcal: 210 }, { name: "Bacon (2)", kcal: 90 },
        { name: "Sausage (2)", kcal: 180 }, { name: "Eggs (2)", kcal: 180 },
      ]},
    ],
  },
  "Denny's": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Mains", items: [
        { name: "Grand Slam (build)", kcal: 790 }, { name: "Moons Over My Hammy", kcal: 840 },
        { name: "Bacon Cheddar Burger", kcal: 1080 }, { name: "Country Fried Steak", kcal: 880 },
        { name: "Sticky Bun Pancakes (short)", kcal: 700 },
      ]},
      { name: "Sides", items: [
        { name: "Hash browns", kcal: 200 }, { name: "Seasoned fries", kcal: 430 },
        { name: "Bacon (4)", kcal: 180 }, { name: "Pancakes (2)", kcal: 340 },
      ]},
    ],
  },
  "Cheesecake Factory": {
    formats: [{ name: "Order", kcal: 0, mult: 1 }],
    groups: [
      { name: "Mains", items: [
        { name: "Chicken Madeira", kcal: 1500 }, { name: "Louisiana Chicken Pasta", kcal: 2370 },
        { name: "Factory Burger", kcal: 1330 }, { name: "Orange Chicken", kcal: 1450 },
        { name: "Chicken Piccata", kcal: 1230 },
      ]},
      { name: "Cheesecake (1 slice)", items: [
        { name: "Original cheesecake", kcal: 830 }, { name: "Oreo Dream Extreme", kcal: 1490 },
        { name: "Reese's PB Chocolate Cake", kcal: 1330 }, { name: "Strawberry cheesecake", kcal: 760 },
      ]},
    ],
  },
  "Smoothie King": {
    formats: [{ name: "20 oz", kcal: 0, mult: 1 }],
    groups: [
      { name: "Smoothies", items: [
        { name: "Angel Food", kcal: 340 }, { name: "Peanut Power Plus Chocolate", kcal: 600 },
        { name: "Strawberry X-Treme", kcal: 380 }, { name: "Gladiator (vanilla)", kcal: 200 },
        { name: "Pure Recharge Mango", kcal: 280 }, { name: "Hulk (chocolate)", kcal: 970 },
      ]},
    ],
  },
};
