document.addEventListener("DOMContentLoaded", function () {
    if (typeof window.data === "undefined" || !Array.isArray(window.data) || window.data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu đã load:", window.data);

    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const formatWeekday = d3.timeFormat("%A");
    const tableau10 = d3.schemeTableau10;

    const data1 = window.data.map(d => {
        const dateObj = parseDate(d["Thời gian tạo đơn"]);
        return {
            "Ngày tạo đơn": d3.timeFormat("%Y-%m-%d")(dateObj),
            "Ngày trong tuần": formatWeekday(dateObj),
            "Doanh số bán": parseFloat(d["Thành tiền"]) || 0
        };
    });

    const weekdayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const weekdayVietnamese = {
        "Monday": "Thứ Hai",
        "Tuesday": "Thứ Ba",
        "Wednesday": "Thứ Tư",
        "Thursday": "Thứ Năm",
        "Friday": "Thứ Sáu",
        "Saturday": "Thứ Bảy",
        "Sunday": "Chủ Nhật"
    };

    const totalRevenueByDate = d3.rollups(
        data1,
        v => d3.sum(v, d => d["Doanh số bán"]),
        d => d["Ngày tạo đơn"]
    ).map(([date, totalRevenue]) => ({ "Ngày tạo đơn": date, "Doanh số bán": totalRevenue }));

    const revenueStatsByWeekday = d3.rollups(
        totalRevenueByDate,
        v => d3.mean(v, d => d["Doanh số bán"]),
        d => formatWeekday(d3.timeParse("%Y-%m-%d")(d["Ngày tạo đơn"]))
    ).map(([day, avgRevenue]) => ({
        "Ngày trong tuần": day,
        "Doanh số bán trung bình": Math.floor(avgRevenue)
    }));

    revenueStatsByWeekday.sort((a, b) => weekdayOrder.indexOf(a["Ngày trong tuần"]) - weekdayOrder.indexOf(b["Ngày trong tuần"]));

    const margin = { top: 40, right: 20, bottom: 50, left: 100 },
        width = 700,
        height = 400;

    const svg = d3.select("#Q4")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(revenueStatsByWeekday.map(d => weekdayVietnamese[d["Ngày trong tuần"]]))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(revenueStatsByWeekday, d => d["Doanh số bán trung bình"])])
        .nice()
        .range([height, 0]);

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "10px")
        .style("text-anchor", "middle");

    chart.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(d / 1000000).toFixed(0)}M`))
        .style("font-size", "10px");

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "8px")
        .style("border", "1px solid #ccc")
        .style("opacity", 0)
        .style("pointer-events", "none")
        .style("text-align", "left");

    chart.selectAll(".bar")
        .data(revenueStatsByWeekday)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(weekdayVietnamese[d["Ngày trong tuần"]]))
        .attr("y", d => y(d["Doanh số bán trung bình"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Doanh số bán trung bình"]))
        .attr("fill", (d, i) => tableau10[i % tableau10.length])
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1)
                .html(`<strong>${weekdayVietnamese[d["Ngày trong tuần"]]}</strong><br>Doanh số bán trung bình: ${Math.floor(d["Doanh số bán trung bình"]).toLocaleString()} VNĐ`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });

    chart.selectAll(".label")
        .data(revenueStatsByWeekday)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(weekdayVietnamese[d["Ngày trong tuần"]]) + x.bandwidth() / 2)
        .attr("y", d => y(d["Doanh số bán trung bình"]) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "black")
        .text(d => `${Math.floor(d["Doanh số bán trung bình"]).toLocaleString()} VNĐ`);
});