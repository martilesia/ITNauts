
# AstroBase

### Junior Astronaut Mission Trainer

## About the Project

**AstroBase** is an interactive web application designed for children aged 7 to 12, aiming to teach basic concepts of space exploration through simulated missions to the Moon and Mars.

The user takes on the role of a space mission commander and must make decisions to keep the base operational by managing resources such as energy, oxygen, and food while facing different challenges.

## Objectives

- Teach basic concepts of space exploration.
- Develop critical thinking and decision-making skills.
- Demonstrate the importance of resource management in a space mission.
- Present information related to NASA missions and data.

## Main Features

- **Mission Selection:** Choose between a mission to the Moon or Mars.
- **Dashboard:** View the available resources.
- **Resource Management:** Manage energy, oxygen, and food supplies.
- **Space Events:** Face unexpected events during the mission.
- **Decision-Making:** Choose solutions to the challenges presented.
- **Educational Feedback:** Understand the consequences of each decision.
- **Results:** View mission performance at the end.
- **Restart Mission:** Start a new experience.

## Technologies Used

- React
- Vite
- JavaScript
- Tailwind CSS
- Supabase
- NASA Open APIs
- Git and GitHub

## Project Structure

```text
astrobase/
│
├── public/
│   └── images/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── data/
│   ├── services/
│   ├── game/
│   ├── App.jsx
│   └── main.jsx
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone REPOSITORY_URL
```

### 2. Navigate to the project folder

```bash
cd astrobase
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the application

```bash
npm run dev
```

Then, open the address displayed by Vite in your browser, usually:

```text
http://localhost:5173
```

## Supabase Configuration

Create a `.env` file in the root directory of the project and add:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Fill in the values with your Supabase project credentials. Never expose private keys in public code.

## How It Works

1. The user enters the home page.
2. Selects a mission to the Moon or Mars.
3. Accesses the space base dashboard.
4. Checks the available resources.
5. Receives space events and challenges.
6. Makes decisions to solve the challenges.
7. Observes the consequences of their choices.
8. Views the final mission results.

## NASA Data

The project aims to use data and resources provided by NASA to enrich the educational experience.

Reference resources:

- [NASA Open APIs](https://api.nasa.gov/)
- [NASA DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/)
- [NASA Open Science Data Repository](https://osdr.nasa.gov/)

## Scope of the First Version

The first version of AstroBase will be simple and focused on essential features:

- Two mission options: Moon and Mars.
- Management of three main resources.
- Events and challenges with consequences.
- Interactive dashboard.
- Mission results presentation.

Features will be developed gradually, taking into account the available time.

## Target Audience

Children aged 7 to 12 who are interested in science, technology, and space exploration.

## Project Status

In development — NASA Space Apps Challenge 2026.

## License

Academic project developed as part of the NASA Space Apps Challenge 2026.
