# Description

PROWAC, or Progressive Web App Crawler, crawls a specified set of sites and checks for various indicators that those sites are [Progressive Web Apps](https://developers.google.com/web/progressive-web-apps#learnmore). The technologies that we are interested in checking for include [Web App Manifest](https://www.w3.org/TR/appmanifest), [Service Workers](https://www.w3.org/TR/service-workers), [W3C Push API](https://www.w3.org/TR/push-api), and others.

# Design

The project is separated into 3 pieces: Crawler, Dashboard, Data Store. In the source directory, you will notice that there are 3 subdirectories named crawler, dashboard, and dataStore.

## Crawler - top/crawler

- __main.js__ - This is the source of the main driver for the crawler. It uses the `urlJobPopulator` module to populate its list of jobs and uses the `urlJobProcessor` module to process each of those jobs. It stores the output of each job using the `dataStore` module.
- __urlJobPopulator.js__ - This module is responsible for supplying the website URLs that the crawler should examine. This module selects and loads a backend from the urlJobPopulatorBackends/ directory and delegates its work to the backend.
- __urlJobPopulatorBackends/__ - This directory contains the backends available for populating URL jobs. The most important is alexa.js which fetches the Alexa top 1 million sites list and populates the url job list from that data.
- __urlJobProcessor.js__ - This module is responsible for loading the site probes and running them on each URL job. The results get passed to the caller.
- __urlJobProcessorProbes/__ - This directory contains the probes available for analyzing sites. Each probe checks for a technology that we're interested in. See the top-level description of the project for examples of what probes might check for.

## Dashboard - top/dashboard

This section is in progress.

## DataStore - top/dataStore

- __dataStore.js__ - This module is responsible for providing an API that allows data to be stored from the output of processing URL jobs, and that allows data to be retrieved by the dashboard. This module loads a backend and delegates data storage and retrieval to the backend.
- __backend-*.js__ - These are the backends available for the main data store module to load. Each of these files implements the same interface using a different storage technology. Examples include storing data in memory and storing data in a redis DB.

## npm scripts

## Building

## Running

Install Redis

Configure with env vars
`REDIS_URL` environment variable (defaults to "redis://localhost:6379") 
