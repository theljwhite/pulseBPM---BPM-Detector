import React from "react";
import { Box, Heading, Spinner } from "grommet";

const LoadingModal: React.FC = () => {
  const gradient =
    "radial-gradient(circle, rgba(240, 98, 169, 1) 0%, rgba(12, 41, 61, 1) 100%)";

  return (
    <React.Fragment>
      <Box align="center" className="spotify-container">
        <Box
          align="center"
          gap="none"
          alignSelf="center"
          margin={{ top: "large" }}
        >
          <Spinner
            background={gradient}
            border={[
              {
                side: "all",
                color: "pink",
                size: "large",
                style: "groove",
              },
            ]}
            size="medium"
          />

          <Box animation={{ type: "pulse", size: "medium", duration: 2000 }}>
            <Heading color="pink" size="small">
              Loading...
            </Heading>
          </Box>
        </Box>
      </Box>
    </React.Fragment>
  );
};

export default LoadingModal;
