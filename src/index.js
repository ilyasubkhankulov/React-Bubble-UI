import React, { useState, useLayoutEffect, useRef } from "react";
import styles from "./styles.module.css";

export const defaultOptions = {
  size: 200,
  minSize: 20,
  gutter: 16,
  provideProps: false,
  numCols: 6,
  fringeWidth: 100,
  yRadius: 200,
  xRadius: 200,
  cornerRadius: 100,
  showGuides: false,
  compact: false,
  gravitation: 0,
};

export default function BubbleElement(props) {
  if (!props.children) {
    return null;
  }
  let options = {};
  Object.assign(options, defaultOptions);
  Object.assign(options, props.options);
  options.numCols = Math.min(options.numCols, props.children.length);

  const minProportion = options.minSize / options.size;

  const verticalPadding = `calc(50% - ${
    options.yRadius +
    options.size / 2 -
    (options.cornerRadius * (1.414 - 1)) / 1.414
  }px)`;
  const horizontalPadding = `calc(50% - ${
    options.xRadius +
    options.size / 2 -
    (options.cornerRadius * (1.414 - 1)) / 1.414
  }px)`;

  const scrollable = useRef(null);

  let rows = [];
  var colsRemaining = 0;
  var evenRow = true;
  for (var i = 0; i < props.children.length; i++) {
    if (colsRemaining == 0) {
      colsRemaining = evenRow ? options.numCols - 1 : options.numCols;
      evenRow = !evenRow;
      rows.push([]);
    }
    rows[rows.length - 1].push(props.children[i]);
    colsRemaining--;
  }
  if (rows.length > 1) {
    if (rows[rows.length - 1].length % 2 == rows[rows.length - 2].length % 2) {
      rows[rows.length - 1].push(<div></div>); // dummy bubble
    }
  }

  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDown(true);
    scrollable.current.classList.add("active");
    setStartX(e.pageX - scrollable.current.offsetLeft);
    setStartY(e.pageY - scrollable.current.offsetTop);
    setScrollLeft(scrollable.current.scrollLeft);
    setScrollTop(scrollable.current.scrollTop);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
    scrollable.current.classList.remove("active");
  };

  const handleMouseUp = () => {
    setIsDown(false);
    scrollable.current.classList.remove("active");
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - scrollable.current.offsetLeft;
    const y = e.pageY - scrollable.current.offsetTop;
    const walk = (x - startX) * 2;
    const topwalk = (y - startY) * 2;
    scrollable.current.scrollLeft = scrollLeft - walk;
    scrollable.current.scrollTop = scrollTop - topwalk;
  };

  const handleScroll = (e) => {
    if (e.target.className) {
      setScrollTop(e.target.scrollTop);
      setScrollLeft(e.target.scrollLeft);
    }
  };
  useLayoutEffect(() => {
    window.addEventListener("scroll", handleScroll);

    scrollable.current.scrollTo(
      (scrollable.current.scrollWidth - scrollable.current.clientWidth) / 2,
      (scrollable.current.scrollHeight - scrollable.current.clientHeight) / 2
    );

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const interpolate = (actualMin, actualMax, val, targetMin, targetMax) => {
    return (
      ((val - actualMin) / (actualMax - actualMin)) * (targetMax - targetMin) +
      targetMin
    );
  };

  const getBubbleSize = (row, col) => {
    const yOffset =
      (options.size + options.gutter) * 0.866 * row -
      options.size +
      (options.cornerRadius * (1.414 - 1)) / 1.414 -
      (options.yRadius - options.size);
    //  - options.cornerRadius / 1.414;
    const xOffset =
      (options.size + options.gutter) * col +
      ((options.numCols - rows[row].length) * (options.size + options.gutter)) /
        2 -
      options.size +
      (options.cornerRadius * (1.414 - 1)) / 1.414 -
      (options.xRadius - options.size);
    // - options.cornerRadius / 1.414;
    const dy = yOffset - scrollTop;
    const dx = xOffset - scrollLeft;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // let theta = Math.atan(dy / dx);
    // if (dx < 0) theta += Math.PI;
    let out = {
      bubbleSize: 1,
      translateX: 0,
      translateY: 0,
      distance: distance,
    };
    let distanceFromEdge = 0;
    let isInCornerRegion = false;
    if (Math.abs(dx) <= options.xRadius && Math.abs(dy) <= options.yRadius) {
      // inner square
      if (
        Math.abs(dy) > options.yRadius - options.cornerRadius &&
        Math.abs(dx) > options.xRadius - options.cornerRadius
      ) {
        // in corner region
        const distToInnerCorner = Math.sqrt(
          Math.pow(Math.abs(dy) - options.yRadius + options.cornerRadius, 2) +
            Math.pow(Math.abs(dx) - options.xRadius + options.cornerRadius, 2)
        );
        if (distToInnerCorner > options.cornerRadius) {
          // outside inner radius
          distanceFromEdge = distToInnerCorner - options.cornerRadius;
          isInCornerRegion = true;
        }
      }
    } else if (
      Math.abs(dx) <= options.xRadius + options.fringeWidth &&
      Math.abs(dy) <= options.yRadius + options.fringeWidth
    ) {
      // outer square
      if (
        Math.abs(dy) > options.yRadius - options.cornerRadius &&
        Math.abs(dx) > options.xRadius - options.cornerRadius
      ) {
        // in corner region
        isInCornerRegion = true;
        const distToInnerCorner = Math.sqrt(
          Math.pow(Math.abs(dy) - options.yRadius + options.cornerRadius, 2) +
            Math.pow(Math.abs(dx) - options.xRadius + options.cornerRadius, 2)
        );
        distanceFromEdge = distToInnerCorner - options.cornerRadius;
      } else {
        distanceFromEdge = Math.max(
          Math.abs(dx) - options.xRadius,
          Math.abs(dy) - options.yRadius
        );
      }
    } else {
      // outside outer square
      isInCornerRegion =
        Math.abs(dy) > options.yRadius - options.cornerRadius &&
        Math.abs(dx) > options.xRadius - options.cornerRadius;
      if (isInCornerRegion) {
        const distToInnerCorner = Math.sqrt(
          Math.pow(Math.abs(dy) - options.yRadius + options.cornerRadius, 2) +
            Math.pow(Math.abs(dx) - options.xRadius + options.cornerRadius, 2)
        );
        distanceFromEdge = distToInnerCorner - options.cornerRadius;
      } else {
        distanceFromEdge = Math.max(
          Math.abs(dx) - options.xRadius,
          Math.abs(dy) - options.yRadius
        );
      }
    }

    out.bubbleSize = interpolate(
      0,
      options.fringeWidth,
      Math.min(distanceFromEdge, options.fringeWidth),
      1,
      minProportion
    );

    //handle magnitudes

    const translationMag = options.compact
      ? (options.size - options.minSize) / 2
      : 0;
    const interpolatedTranslationMag = interpolate(
      0,
      options.fringeWidth,
      distanceFromEdge,
      0,
      translationMag
    );

    if (distanceFromEdge > 0 && distanceFromEdge <= options.fringeWidth) {
      out.translateX = interpolatedTranslationMag;
      out.translateY = interpolatedTranslationMag;
    } else if (distanceFromEdge - options.fringeWidth > 0) {
      const extra =
        (Math.max(
          0,
          distanceFromEdge - options.fringeWidth - options.size / 2
        ) *
          options.gravitation) /
        10;
      out.translateX = translationMag + extra;
      out.translateY = translationMag + extra;
    }

    if (isInCornerRegion) {
      const cornerDx = Math.abs(dx) - options.xRadius + options.cornerRadius;
      const cornerDy = Math.abs(dy) - options.yRadius + options.cornerRadius;
      let theta = Math.atan(-cornerDy / cornerDx);
      if (dx > 0) {
        if (dy > 0) {
          theta *= -1;
        }
      } else {
        if (dy > 0) {
          theta += Math.PI;
        } else {
          theta += Math.PI - 2 * theta;
        }
      }
      out.translateX *= -Math.cos(theta);
      out.translateY *= -Math.sin(theta);
    } else if (
      Math.abs(dx) > options.xRadius ||
      Math.abs(dy) > options.yRadius
    ) {
      if (Math.abs(dx) > options.xRadius) {
        out.translateX *= -Math.sign(dx);
        out.translateY = 0;
      } else {
        out.translateY *= -Math.sign(dy);
        out.translateX = 0;
      }
    }

    return out;
  };

  return (
    <div
      className={props.className}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        ...props.style,
      }}
    >
      <div className={styles.container}>
        <div
          className={styles.scrollable}
          ref={scrollable}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div
            className={styles.horizontalSpacer}
            style={{
              height: verticalPadding,
            }}
          ></div>
          <div
            className={styles.rowContainer}
            style={{
              width:
                options.size * options.numCols +
                options.gutter * (options.numCols - 1),
              paddingLeft: horizontalPadding,
              paddingRight: horizontalPadding,
            }}
          >
            {rows.map((row, i) => {
              return (
                <div
                  className={styles.row}
                  key={i}
                  style={{
                    marginTop:
                      i > 0
                        ? options.size * -0.134 + options.gutter * 0.866 // .134 is sqrt(3) - 1
                        : 0,
                  }}
                >
                  {row.map((comp, j) => {
                    const {
                      bubbleSize,
                      translateX,
                      translateY,
                      distance,
                    } = getBubbleSize(i, j);
                    return (
                      <div
                        key={j}
                        className={styles.bubbleContainer}
                        style={{
                          width: options.size,
                          height: options.size,
                          marginRight: options.gutter / 2,
                          marginLeft: options.gutter / 2,
                          transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${bubbleSize})`,
                        }}
                      >
                        {options.provideProps
                          ? React.cloneElement(comp, {
                              bubbleSize: bubbleSize * options.size,
                              distanceToCenter: distance,
                              maxSize: options.size,
                              minSize: options.minSize,
                            })
                          : comp}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div
            className={styles.horizontalSpacer}
            style={{
              height: verticalPadding,
            }}
          ></div>
        </div>

        {options.showGuides ? (
          <div className={styles.guideContainer}>
            <div
              className={styles.guide}
              style={{
                height: options.yRadius * 2,
                width: options.xRadius * 2,
                borderRadius:
                  options.shape == "ellipse" ? "50%" : options.cornerRadius,
              }}
            ></div>
            <div
              className={styles.guide}
              style={{
                height: (options.yRadius + options.fringeWidth) * 2,
                width: (options.xRadius + options.fringeWidth) * 2,
                borderRadius:
                  options.shape == "ellipse"
                    ? "50%"
                    : options.cornerRadius + options.fringeWidth,
              }}
            ></div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
