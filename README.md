# ECHO

A browser-based laboratory for timelike test-particle geodesics around a non-rotating Schwarzschild black hole. Open `echo.html` directly in a modern browser. No installation, server, external fonts, or runtime dependencies are required.

## Interface

The graphite interface uses quiet borders, a muted sage accent, and a responsive simulation viewport. Select **Geodesics**, **Effective potential**, or **Time dilation** from the navigation. The layout adapts to desktop and mobile screens.

- **Animate motion** starts or pauses continuous looped playback. **Restart** returns to its initial state.
- Changing the camera, surface tilt, path visibility, or particle size preserves the orbit and playback position.
- Changing mass or angular momentum generates a new orbit. Angular momentum remains adjustable when animation and the path are off.
- **Mass** accepts values from 0.1 to 1000 and expands the camera range when needed. The angular momentum L is held fixed when M changes, so L/M changes too.
- **Export data** downloads the complete sampled trajectory or a scalar-field matrix.

## Physics model

Geometric units are used: G = c = 1, horizon radius r_s = 2M. Particles are massive test particles in the equatorial plane. Their gravity, radiation reaction, collisions, black-hole spin, and accretion are excluded.

With proper time tau, specific energy E, and specific angular momentum L, the Schwarzschild equations are

```text
f(r) = 1 - 2M/r
Veff(r) = f(r) (1 + L²/r²)
dt/dtau = E/f(r)
dphi/dtau = L/r²
(dr/dtau)² + Veff(r) = E²
d²r/dtau² = -M/r² + L²/r³ - 3ML²/r⁴
```

The equivalent spatial orbit equation shown in the interface is

```text
d²u/dphi² + u = M/L² + 3Mu²,    u = 1/r.
```

### Initial conditions

Every orbit begins at phi = t = tau = 0, with zero radial velocity. For L/M >= sqrt(12), the initial radius is 1.1 times the outer circular-orbit radius:

```text
r_c = [L² + L sqrt(L² - 12M²)] / (2M)
r_start = 1.1 r_c
```

Otherwise r_start = 15M. The energy is determined by E = sqrt(Veff(r_start)), rather than chosen independently. Consequently, changing L also changes the starting radius and energy. The transition to a plunge belongs to this initial-condition prescription, not to a universal critical value of L alone. The ISCO is at 6M, with L/M = sqrt(12).

### Numerical evolution and coordinate time

The original Euler–Cromer integrator has been replaced by fourth-order Runge–Kutta integration. The ECHO name is retained. To resolve the horizon approach, the code integrates h = ln(r/M - 2), w = dr/dtau, phi, and tau/M with respect to T = t/M:

```text
rho = r/M = 2 + exp(h)
f = exp(h)/rho
ell = L/M

dh/dT = w/(E rho)
dw/dT = (f/E) [-1/rho² + ell²/rho³ - 3ell²/rho⁴]
dphi/dT = f ell/(E rho²)
d(tau/M)/dT = f/E
```

The default step is delta(t/M) = 0.125, with at most 100,000 steps (t/M = 12,500). Integration stops earlier if r/M - 2 <= 1e-10. This is a finite numerical endpoint outside the horizon. Playback loops back to the initial sample at the end of each pass. Each loop replays the sampled geodesic; the reset is a playback action, not physical motion from the horizon back to the starting radius. The sampled path never crosses the horizon. In the continuum solution, an infalling particle reaches the horizon in finite proper time and infinite Schwarzschild coordinate time.

Playback uses elapsed animation time, with **1x = 50M of coordinate time per real second**, independently of display refresh rate. Pausing or hiding the browser tab pauses playback. Between stored samples, displayed coordinates are linearly interpolated; the exported samples retain the integrated values.

### Scalar surfaces and color

The two 3D modes are illustrative plots of scalar functions, not isometric embeddings of the spatial metric:

- Effective potential: height z = 3M (Veff - 1). The positive scale preserves potential minima and maxima.
- Time dilation: height z = 10M (alpha - 1), where alpha = sqrt(f) is the clock-rate factor for a **static** observer relative to infinity.

Particle color and opacity are schematic functions of alpha. For a static emitter and static receiver at infinity, the frequency ratio is alpha. A moving geodesic emitter also has kinematic shifts and a photon-direction dependence; the color cue does **not** calculate its observed Doppler spectrum or luminosity. The orbit animation is a coordinate-time diagram, not a ray-traced telescope image: light bending, photon travel times, and image formation are not simulated. The moving particle's proper-clock rate is d tau/dt = f/E, not alpha.

## Export format

Geodesic exports use the same cached samples as the displayed path, regardless of camera zoom or visibility. Metadata records M, L, E, the time step, and why sampling ended. Tab-delimited columns are:

```text
Step    r    phi(rad)    x    y    t    tau    dr/dtau
```

Surface exports contain a 50 x 50 matrix of **dimensionless physical Veff or alpha values**, rather than the scaled display height. Metadata specifies the Cartesian grid coordinates. Samples at or inside r_s are `NaN`; the exterior visualization makes no claim about the interior.

## Verification

With Node.js installed, run:

```sh
node --test tests/echo.test.cjs
```

The tests execute the actual inline application script. They cover rendering order, shared projection, elapsed-time playback, pause/restart and looping, control availability, export consistency, analytic circular orbits, near-circular relativistic precession, timelike normalization/energy conservation, horizon approach, integration-step convergence, and the supported mass extremes. Numerical tests validate approximations to the equations; they do not make the simulation an exact analytic solution.

## References

- Tevian Dray, [The Schwarzschild Geodesic Equation](https://sites.science.oregonstate.edu/physics/coursewikis/GGR/book/ggr/schwgeo.html): conserved quantities and the timelike radial equation.
- Tevian Dray, [Circular Orbits](https://sites.science.oregonstate.edu/physics/coursewikis/GGR/book/ggr/ocircle.html): circular-orbit radii and stability.
- Momennia et al. (2024), [Schwarzschild black hole and redshift rapidity](https://doi.org/10.1140/epjc/s10052-024-12933-0): photon frequency is determined by its four-momentum and the emitter/receiver four-velocities; static gravitational redshift alone is not a moving emitter's full frequency shift.

## License

MIT. See `LICENSE`.
