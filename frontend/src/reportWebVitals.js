/** ABSTRACT: reportWebVitals.js
 *  
 *  DESCRIPTION:
 *  Provides a utility to measure and report the performance metrics of
 *  the React application. Uses the `web-vitals` library to track key
 *  web performance indicators such as CLS, FID, FCP, LCP, and TTFB.
 *  The metrics can be logged to the console or sent to an analytics endpoint.
 *
 *  RESPONSIBILITIES:
 *  - Import `web-vitals` dynamically when performance reporting is requested.
 *  - Measure the following performance metrics:
 *      - CLS (Cumulative Layout Shift)
 *      - FID (First Input Delay)
 *      - FCP (First Contentful Paint)
 *      - LCP (Largest Contentful Paint)
 *      - TTFB (Time to First Byte)
 *  - Call the provided callback function (`onPerfEntry`) with each metric.
 *
 *  FUNCTIONS:
 *  - reportWebVitals(onPerfEntry: Function): Initiates performance measurement
 *    and reports metrics to the given callback.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
