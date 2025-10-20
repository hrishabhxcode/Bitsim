import React from "react";

const Block = ({ index, data, hash, prevHash }) => {
  return (
    <div style={{ border: "2px solid #333", padding: "10px", margin: "10px" }}>
      <h3>Block #{index}</h3>
      <p><strong>Data:</strong> {data}</p>
      <p><strong>Hash:</strong> {hash}</p>
      <p><strong>Previous Hash:</strong> {prevHash}</p>
    </div>
  );
};

export default Block;
