document.addEventListener("DOMContentLoaded", function () {
    if (typeof window.data === "undefined" || !Array.isArray(window.data) || window.data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu đã load:", window.data);

    const margin = { top: 40, right: 200, bottom: 50, left: 250 },
        width = 700,
        height = 400;

    const data1 = window.data.map(d => ({
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Mã đơn hàng": d["Mã đơn hàng"]
    }));

    const groupByCategory = d3.group(data1, d => d["Nhóm hàng"]);

    const distinctOrdersByCategory = new Map(
        Array.from(groupByCategory, ([key, values]) => [key, new Set(values.map(d => d["Mã đơn hàng"])).size])
    );

    const totalOrders = new Set(window.data.map(d => d["Mã đơn hàng"])).size;

    const aggregatedData = Array.from(distinctOrdersByCategory, ([nhomHang, count]) => ({
        "Nhóm hàng": nhomHang,
        "XS_Q7": count / totalOrders
    }));

    aggregatedData.sort((a, b) => b["XS_Q7"] - a["XS_Q7"]); 

    const svg = d3.select("#Q7")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(aggregatedData, d => d["XS_Q7"])])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(aggregatedData.map(d => d["Nhóm hàng"]))
        .range([0, height])
        .padding(0.2);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    chart.selectAll(".bar")
        .data(aggregatedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d["Nhóm hàng"]))
        .attr("width", d => x(d["XS_Q7"]))
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d["Nhóm hàng"]))
        .on("mouseover", function (event, d) {
            tooltip.style("display", "block")
                   .html(`Nhóm hàng: ${d["Nhóm hàng"]}<br>Xác suất bán: ${Math.floor(d["XS_Q7"] * 100)}%`)
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        });

    chart.selectAll(".label")
        .data(aggregatedData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d["XS_Q7"]) - 5)
        .attr("y", d => y(d["Nhóm hàng"]) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(d => `${(d["XS_Q7"] * 100).toFixed(1)}%`)
        .style("fill", "white")
        .style("font-size", "11px");

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format(".0%")))
        .style("font-size", "11px");

    chart.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "11px")
        .style("text-anchor", "end");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "5px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("display", "none");
});