"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = void 0;
function debounce(func, wait) {
    let timeoutId;
    // @ts-ignore
    return (...args) => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, wait);
    };
}
exports.debounce = debounce;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsU0FBZ0IsUUFBUSxDQUFxQyxJQUFPLEVBQUUsSUFBWTtJQUNoRixJQUFJLFNBQXFDLENBQUM7SUFDMUMsYUFBYTtJQUNiLE9BQU8sQ0FBQyxHQUFHLElBQW1CLEVBQUUsRUFBRTtRQUNoQyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUM1QixZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUNELFNBQVMsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO1lBQzFCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ2hCLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNYLENBQUMsQ0FBQztBQUNKLENBQUM7QUFYRCw0QkFXQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBkZWJvdW5jZTxUIGV4dGVuZHMgKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkPihmdW5jOiBULCB3YWl0OiBudW1iZXIpOiBUIHtcbiAgbGV0IHRpbWVvdXRJZDogTm9kZUpTLlRpbWVvdXQgfCB1bmRlZmluZWQ7XG4gIC8vIEB0cy1pZ25vcmVcbiAgcmV0dXJuICguLi5hcmdzOiBQYXJhbWV0ZXJzPFQ+KSA9PiB7XG4gICAgaWYgKHRpbWVvdXRJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gICAgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBmdW5jKC4uLmFyZ3MpO1xuICAgIH0sIHdhaXQpO1xuICB9O1xufVxuIl19