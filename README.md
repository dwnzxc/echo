# ECHO
**Euler-Cromer Horizon Observer**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Physics](https://img.shields.io/badge/Physics-Relativity-7dd3fc?style=for-the-badge)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-None-brightgreen?style=for-the-badge)

ECHO is a zero-dependency HTML5/JS engine built to visualize spacetime curvature and orbital dynamics around a non-rotating (Schwarzschild) black hole. It runs entirely in the browser using the Canvas API, calculating test particle geodesics and metric topology in real-time.

## Overview

The core goal of this project is to accurately represent General Relativity from the perspective of a distant observer, utilizing pure mathematics without relying on heavy 3D rendering libraries like Three.js. 

Key technical features include:
* **Custom Integration Engine:** Uses an Euler-Cromer numerical method to solve the exact non-linear differential equations for geodesics in curved spacetime.
* **Relativistic Observer Effects:** * Implements gravitational time dilation (particle animation approaches $v=0$ as it nears the Event Horizon).
  * Calculates exact Doppler redshift, interpolating the particle's visual spectrum from cyan to red before luminosity drops to zero at the horizon boundary.
* **3D Isometric Rendering:** A custom mathematical projection engine maps the 2D radial data into a 3D wireframe mesh for visualizing potential wells.
* **Data Matrix Export:** Generates high-resolution, tab-delimited `.txt` matrices of the calculated trajectories and spatial depth mappings for external analysis.

## Simulation Modes

**1. Equatorial Geodesics (2D)**
A top-down numerical ray-tracer simulating the path of a massive test particle. The Specific Angular Momentum ($L$) can be fine-tuned (between 3.500 and 3.600) to observe the critical thresholds between stable circular orbits, extreme relativistic precession, and unstable plunges past the ISCO.

**2. Effective Potential (3D)**
An isometric wireframe projection of the radial dynamics potential well:
$$V_{eff}(r) = \left(1 - \frac{r_s}{r}\right)\left(1 + \frac{L^2}{r^2}\right)$$

**3. Time Dilation Well (3D)**
A topological mapping of the Schwarzschild Lapse function, visualizing the gradient of time dilation as one approaches the central mass:
$$\alpha(r) = \sqrt{1 - \frac{r_s}{r}}$$

## Physics Assumptions

This simulation adheres to Geometric Units ($G = c = 1$).

* **Observer Perspective:** The simulation renders using Coordinate Time ($t$). Because time dilation approaches infinity at the event horizon, simulated particles will never cross $r_s$; they will freeze and redshift to infinity.
* **Test Particles:** Simulated objects are considered "test particles." Their rest mass ($m$) is negligible, meaning they follow the geodesics of the static Schwarzschild metric without perturbing it or interacting gravitationally with each other.

## Customization

The physics definitions are decoupled from the rendering loop. To modify the underlying metric (for example, adapting it to a Kerr rotating black hole), locate the `relFunctions` and `equations` objects within the `<script>` tag.

## License

Distributed under the MIT License. See `LICENSE` for more information.
