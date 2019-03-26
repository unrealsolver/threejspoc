function _assignUVs(geometry) {
  // This function is based on the code found at (the original source doesn't work well)
  // http://stackoverflow.com/questions/20774648/three-js-generate-uv-coordinate
  //
  // She following page explains how UV map should be calculated
  // https://solutiondesign.com/blog/-/blogs/webgl-and-three-js-texture-mappi-1/
  //
  // The following documentation shows what a apherical UV map should look like
  // https://threejs.org/examples/#misc_uv_tests

  // converting all vertices into polar coordinates
  var polarVertices = geometry.vertices.map(cartesian2polar);

  geometry.faceVertexUvs[0] = []; // This clears out any UV mapping that may have already existed on the object

  // walking through all the faces defined by the object
  // ... we need to define a UV map for each of them
  geometry.faces.forEach(function(face) {
    var uvs = [];

    // Each face is a triangle defined by three points or vertices (point a, b and c).
    // Instead of storing the three points (vertices) by itself,
    // a face uses points from the [vertices] array.
    // The 'a', 'b' and 'c' properties of the [face] object in fact represent
    // index at which each of the three points is stored in the [vertices] array
    var ids = ["a", "b", "c"];

    for (var i = 0; i < ids.length; i++) {
      // using the point to access the vertice
      var vertexIndex = face[ids[i]];
      var vertex = polarVertices[vertexIndex];

      // If the vertice is located at the top or the bottom
      // of the sphere, the x coordinates will always be 0
      // This isn't good, since it will make all the faces
      // which meet at this point use the same starting point
      // for their texture ...
      // this is a bit difficult to explainm, so try to comment out
      // the following block and take look at the top of the
      // spehere to see how it is mapped. Also have a look
      // at the following image: https://dev.ngit.hr/vr/textures/sphere-uv.png
      if (vertex.theta === 0 && (vertex.phi === 0 || vertex.phi === Math.PI)) {
        // at the sphere bottom and at the top different
        // points are alligned differently - have a look at the
        // following image https://dev.ngit.hr/vr/textures/sphere-uv.png
        var alignedVertice = vertex.phi === 0 ? face.b : face.a;

        vertex = {
          phi: vertex.phi,
          theta: polarVertices[alignedVertice].theta
        };
      }

      // Fixing vertices, which close the gap in the circle
      // These are the last vertices in a row, and are at identical position as
      // vertices which are at the first position in the row.
      // This causes the [theta] angle to be miscalculated
      if (
        vertex.theta === Math.PI &&
        cartesian2polar(face.normal).theta < Math.PI / 2
      ) {
        vertex.theta = -Math.PI;
      }

      var canvasPoint = polar2canvas(vertex);

      uvs.push(new THREE.Vector2(1 - canvasPoint.x, 1 - canvasPoint.y));
    }

    geometry.faceVertexUvs[0].push(uvs);
  });
  geometry.uvsNeedUpdate = true;
} // function _assignUVs(geometry) {...}
